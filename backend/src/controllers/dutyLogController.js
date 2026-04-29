const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

// UC-14: duty logging valid when flight is active or completed
const LOGGABLE_STATES = new Set(['Departed', 'En_Route', 'Landed', 'Completed']);

// Reusable computed expression for duty duration
const DUTY_HRS = `ROUND(EXTRACT(EPOCH FROM (dl.duty_end - dl.duty_start)) / 3600.0, 2)`;

// ─── Internal helper ──────────────────────────────────────────────────────────

const getFlightStatus = async (flightId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(fs.status, 'Scheduled') AS status
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

const create = async (req, res, next) => {
  try {
    const { emp_id, flight_id, duty_start, duty_end, observations } = req.body;

    // 1. Employee must be assigned to this flight (UC-14 precondition)
    const { rows: assigned } = await pool.query(
      'SELECT 1 FROM crew_assignment WHERE emp_id = $1 AND flight_id = $2',
      [emp_id, flight_id]
    );
    if (!assigned.length) {
      return next(AppError.forbidden(
        'Employee is not assigned to this flight and cannot log duty for it'
      ));
    }

    // 2. Flight must be in a loggable state (UC-14: Landed preferred, active allowed)
    const flightStatus = await getFlightStatus(flight_id);
    if (!flightStatus) return next(AppError.notFound('Flight not found'));
    if (!LOGGABLE_STATES.has(flightStatus.status)) {
      return next(AppError.badRequest(
        `Duty logs can only be submitted when a flight is active or completed. ` +
        `Current flight status: '${flightStatus.status}'`
      ));
    }

    // 3. Time range validation (UC-14: E1 — end before start rejected)
    if (new Date(duty_end) <= new Date(duty_start)) {
      return next(AppError.badRequest(
        'Duty end time must be after duty start time'
      ));
    }

    // 4. Insert — UNIQUE(emp_id, flight_id) enforces one log per crew per flight
    const { rows: [log] } = await pool.query(
      `INSERT INTO duty_log (emp_id, flight_id, duty_start, duty_end, observations)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *,
         ROUND(EXTRACT(EPOCH FROM (duty_end - duty_start)) / 3600.0, 2) AS total_duty_hours`,
      [emp_id, flight_id, duty_start, duty_end, observations ?? null]
    );

    return ApiResponse.created(res, log);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id }                          = req.params;
    const { duty_start, duty_end, observations } = req.body;

    // Validate time range if both times are being updated
    const bothProvided = duty_start && duty_end;
    if (bothProvided && new Date(duty_end) <= new Date(duty_start)) {
      return next(AppError.badRequest('Duty end time must be after duty start time'));
    }

    const { rows: [log] } = await pool.query(
      `UPDATE duty_log
       SET duty_start   = COALESCE($1::timestamptz, duty_start),
           duty_end     = COALESCE($2::timestamptz, duty_end),
           observations = COALESCE($3, observations),
           updated_at   = NOW()
       WHERE log_id = $4
       RETURNING *,
         ROUND(EXTRACT(EPOCH FROM (duty_end - duty_start)) / 3600.0, 2) AS total_duty_hours`,
      [duty_start ?? null, duty_end ?? null, observations ?? null, id]
    );

    if (!log) return next(AppError.notFound('Duty log not found'));
    return ApiResponse.success(res, log);
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const { emp_id, flight_id, from_date, to_date } = req.query;
    const { page, limit, offset }                   = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (emp_id)    { conds.push(`dl.emp_id    = $${idx}`);                     params.push(emp_id);    idx++; }
    if (flight_id) { conds.push(`dl.flight_id = $${idx}`);                     params.push(flight_id); idx++; }
    if (from_date) { conds.push(`dl.duty_start >= $${idx}::date`);             params.push(from_date); idx++; }
    if (to_date)   { conds.push(`dl.duty_start <  ($${idx}::date + 1)`);       params.push(to_date);   idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM duty_log dl ${where}`, params),
      pool.query(
        `SELECT
           dl.*,
           ${DUTY_HRS}                        AS total_duty_hours,
           e.name                             AS employee_name,
           e.role                             AS employee_role,
           f.departure_time, f.arrival_time,
           f.source_airport_code, f.dest_airport_code,
           COALESCE(fs.status,'Scheduled')    AS flight_status
         FROM duty_log dl
         JOIN employee e ON e.emp_id     = dl.emp_id
         JOIN flight   f ON f.flight_id  = dl.flight_id
         LEFT JOIN LATERAL (
           SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
           ORDER BY schedule_date DESC LIMIT 1
         ) fs ON TRUE
         ${where}
         ORDER BY dl.duty_start DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         dl.*,
         ${DUTY_HRS}                        AS total_duty_hours,
         e.name                             AS employee_name,
         e.role                             AS employee_role,
         e.contact,
         f.departure_time, f.arrival_time,
         f.source_airport_code, f.dest_airport_code,
         COALESCE(fs.status,'Scheduled')    AS flight_status,
         src.name AS source_airport_name,
         dst.name AS dest_airport_name
       FROM duty_log dl
       JOIN employee e   ON e.emp_id     = dl.emp_id
       JOIN flight   f   ON f.flight_id  = dl.flight_id
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       LEFT JOIN airport src ON src.airport_code = f.source_airport_code
       LEFT JOIN airport dst ON dst.airport_code = f.dest_airport_code
       WHERE dl.log_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return next(AppError.notFound('Duty log not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

// Crew portal — paginated duty history for a specific employee
const getByEmployee = async (req, res, next) => {
  try {
    const { empId }               = req.params;
    const { from_date, to_date }  = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = ['dl.emp_id = $1'];
    const params = [empId];
    let   idx    = 2;

    if (from_date) { conds.push(`dl.duty_start >= $${idx}::date`);           params.push(from_date); idx++; }
    if (to_date)   { conds.push(`dl.duty_start <  ($${idx}::date + 1)`);     params.push(to_date);   idx++; }

    const where = `WHERE ${conds.join(' AND ')}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM duty_log dl ${where}`, params),
      pool.query(
        `SELECT
           dl.*,
           ${DUTY_HRS}                     AS total_duty_hours,
           f.departure_time, f.arrival_time,
           f.source_airport_code, f.dest_airport_code,
           COALESCE(fs.status,'Scheduled') AS flight_status,
           src.name AS source_airport_name, src.city AS source_city,
           dst.name AS dest_airport_name,  dst.city AS dest_city
         FROM duty_log dl
         JOIN flight f ON f.flight_id = dl.flight_id
         LEFT JOIN LATERAL (
           SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
           ORDER BY schedule_date DESC LIMIT 1
         ) fs ON TRUE
         LEFT JOIN airport src ON src.airport_code = f.source_airport_code
         LEFT JOIN airport dst ON dst.airport_code = f.dest_airport_code
         ${where}
         ORDER BY dl.duty_start DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// Admin — crew utilization + duty compliance summary (date-range filterable)
const summary = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;

    const params     = [];
    let   idx        = 1;
    let   dutyFilter = '';   // appended to LEFT JOIN ON clause — keeps employee rows even with no logs

    if (from_date) { dutyFilter += ` AND dl.duty_start >= $${idx}::date`;        params.push(from_date); idx++; }
    if (to_date)   { dutyFilter += ` AND dl.duty_start <  ($${idx}::date + 1)`;  params.push(to_date);   idx++; }

    const { rows } = await pool.query(
      `SELECT
         e.emp_id,
         e.name,
         e.role,
         COUNT(DISTINCT ca.flight_id)                                        AS flights_assigned,
         COUNT(DISTINCT dl.log_id)                                            AS duty_logs_submitted,
         ROUND(
           COALESCE(
             SUM(EXTRACT(EPOCH FROM (dl.duty_end - dl.duty_start)) / 3600.0),
             0
           ), 2
         )                                                                    AS total_duty_hours,
         COUNT(DISTINCT CASE
           WHEN COALESCE(fs.status,'Scheduled') IN ('Landed','Completed')
            AND dl.log_id IS NULL
           THEN ca.flight_id
         END)                                                                 AS pending_duty_logs
       FROM employee e
       JOIN crew_assignment ca ON ca.emp_id    = e.emp_id
       JOIN flight f            ON f.flight_id = ca.flight_id
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       LEFT JOIN duty_log dl
         ON dl.emp_id = e.emp_id AND dl.flight_id = ca.flight_id ${dutyFilter}
       WHERE e.role IN ('Pilot','Cabin_Crew')
       GROUP BY e.emp_id, e.name, e.role
       ORDER BY e.name`,
      params
    );

    return ApiResponse.success(res, rows);
  } catch (err) { next(err); }
};

module.exports = { create, update, list, getById, getByEmployee, summary };
