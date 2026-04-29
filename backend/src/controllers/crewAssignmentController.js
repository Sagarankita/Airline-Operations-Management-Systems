const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');

// Assignment roles and which employee role they require (UC-09 / Lab 07)
const PILOT_ASSIGN_ROLES = new Set(['Captain', 'First Officer', 'Second Officer', 'Cadet']);
const CREW_ASSIGN_ROLES  = new Set(['Cabin_Crew']);
const ALL_ASSIGN_ROLES   = [...PILOT_ASSIGN_ROLES, ...CREW_ASSIGN_ROLES];

const NON_ASSIGNABLE = new Set(['Departed', 'En_Route', 'Landed', 'Cancelled', 'Completed']);
const NON_REMOVABLE  = new Set(['Departed', 'En_Route', 'Landed']);

// ─── Internal helpers ─────────────────────────────────────────────────────────

const getFlightWithStatus = async (client, flightId) => {
  const { rows } = await client.query(
    `SELECT f.*,
            COALESCE(fs.status, 'Scheduled') AS schedule_status
     FROM   flight f
     LEFT JOIN LATERAL (
       SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
       ORDER BY schedule_date DESC LIMIT 1
     ) fs ON TRUE
     WHERE f.flight_id = $1`,
    [flightId]
  );
  return rows[0] || null;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

const getByFlight = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT ca.emp_id, ca.flight_id, ca.assignment_date, ca.role AS assignment_role,
              e.name, e.role AS employee_role, e.status AS employee_status, e.contact,
              p.rank AS pilot_rank, p.fitness AS pilot_fitness, p.total_flight_hours,
              cc.fitness AS crew_fitness, cc.total_exp_years
       FROM   crew_assignment ca
       JOIN   employee    e  ON e.emp_id  = ca.emp_id
       LEFT JOIN pilot       p  ON p.emp_id  = ca.emp_id
       LEFT JOIN cabin_crew  cc ON cc.emp_id = ca.emp_id
       WHERE  ca.flight_id = $1
       ORDER  BY ca.role, e.name`,
      [id]
    );
    return ApiResponse.success(res, rows);
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const { id: flightId }                         = req.params;
    const { emp_id, role: assignmentRole, assignment_date } = req.body;

    // 1. Flight must exist and be in an assignable state
    const flight = await getFlightWithStatus(pool, flightId);
    if (!flight) return next(AppError.notFound('Flight not found'));
    if (NON_ASSIGNABLE.has(flight.schedule_status)) {
      return next(AppError.conflict(
        `Cannot assign crew to a '${flight.schedule_status}' flight`
      ));
    }

    // 2. Employee must exist and be Active
    const { rows: [emp] } = await pool.query(
      `SELECT e.role AS employee_role, e.status,
              p.fitness AS pilot_fitness,
              cc.fitness AS crew_fitness
       FROM   employee e
       LEFT JOIN pilot      p  ON p.emp_id  = e.emp_id
       LEFT JOIN cabin_crew cc ON cc.emp_id = e.emp_id
       WHERE e.emp_id = $1`,
      [emp_id]
    );
    if (!emp) return next(AppError.notFound('Employee not found'));
    if (emp.status !== 'Active') {
      return next(AppError.badRequest(`Employee is '${emp.status}' and cannot be assigned`));
    }

    // 3. Role-fit validation (Lab 07 employee hierarchy)
    if (PILOT_ASSIGN_ROLES.has(assignmentRole) && emp.employee_role !== 'Pilot') {
      return next(AppError.badRequest(
        `Assignment role '${assignmentRole}' requires a Pilot — employee role is '${emp.employee_role}'`
      ));
    }
    if (CREW_ASSIGN_ROLES.has(assignmentRole) && emp.employee_role !== 'Cabin_Crew') {
      return next(AppError.badRequest(
        `Assignment role 'Cabin_Crew' requires a Cabin Crew employee — employee role is '${emp.employee_role}'`
      ));
    }

    // 4. Fitness guard — block Unfit employees
    const fitness = emp.pilot_fitness || emp.crew_fitness;
    if (fitness === 'Unfit') {
      return next(AppError.conflict(
        'Employee is marked Unfit and cannot be assigned to a flight'
      ));
    }

    // 5. Schedule conflict — no overlapping active flight for this employee
    const { rows: conflicts } = await pool.query(
      `SELECT ca.flight_id
       FROM   crew_assignment ca
       JOIN   flight f ON f.flight_id = ca.flight_id
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       WHERE  ca.emp_id     = $1
         AND  ca.flight_id != $2
         AND  COALESCE(fs.status,'Scheduled') NOT IN ('Cancelled','Completed')
         AND  (f.departure_time, f.arrival_time)
              OVERLAPS ($3::timestamptz, $4::timestamptz)
       LIMIT 1`,
      [emp_id, flightId, flight.departure_time, flight.arrival_time]
    );
    if (conflicts.length) {
      return next(AppError.conflict(
        `Employee has a scheduling conflict with flight ${conflicts[0].flight_id} during the same window`
      ));
    }

    // 6. Persist — upsert so re-assigning with a new role updates gracefully
    const date = assignment_date || new Date(flight.departure_time).toISOString().slice(0, 10);
    const { rows: [assignment] } = await pool.query(
      `INSERT INTO crew_assignment (emp_id, flight_id, assignment_date, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (emp_id, flight_id, assignment_date)
         DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [emp_id, flightId, date, assignmentRole]
    );

    return ApiResponse.created(res, assignment, 'Crew member assigned to flight');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { id: flightId, empId } = req.params;

    const { rows: [sched] } = await pool.query(
      `SELECT status FROM flight_schedule WHERE flight_id = $1
       ORDER BY schedule_date DESC LIMIT 1`,
      [flightId]
    );
    if (sched && NON_REMOVABLE.has(sched.status)) {
      return next(AppError.conflict(
        `Cannot remove crew from a flight that is already '${sched.status}'`
      ));
    }

    const { rowCount } = await pool.query(
      'DELETE FROM crew_assignment WHERE flight_id = $1 AND emp_id = $2',
      [flightId, empId]
    );
    if (!rowCount) return next(AppError.notFound('Crew assignment not found'));
    return ApiResponse.noContent(res);
  } catch (err) { next(err); }
};

// Crew-portal: list an employee's assignments (upcoming or all)
const getByEmployee = async (req, res, next) => {
  try {
    const { empId }    = req.params;
    const { upcoming } = req.query;

    const params = [empId];
    const extra  = upcoming === 'true' ? 'AND f.departure_time > NOW()' : '';

    const { rows } = await pool.query(
      `SELECT ca.emp_id, ca.flight_id, ca.assignment_date,
              ca.role AS assignment_role,
              f.departure_time, f.arrival_time,
              f.source_airport_code, f.dest_airport_code,
              COALESCE(fs.status, 'Scheduled') AS flight_status,
              fs.delay_reason,
              src.name AS source_airport_name, src.city AS source_city,
              dst.name AS dest_airport_name,   dst.city AS dest_city,
              ac.model AS aircraft_model, ac.manufacturer
       FROM   crew_assignment ca
       JOIN   flight f ON f.flight_id = ca.flight_id
       LEFT JOIN LATERAL (
         SELECT status, delay_reason FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       LEFT JOIN airport  src ON src.airport_code = f.source_airport_code
       LEFT JOIN airport  dst ON dst.airport_code = f.dest_airport_code
       LEFT JOIN aircraft ac  ON ac.aircraft_id   = f.aircraft_id
       WHERE ca.emp_id = $1 ${extra}
       ORDER BY f.departure_time ASC`,
      params
    );

    return ApiResponse.success(res, rows);
  } catch (err) { next(err); }
};

module.exports = { getByFlight, assign, remove, getByEmployee };
