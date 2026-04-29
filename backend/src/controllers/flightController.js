const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

// ─── Lab 07 Flight state machine ─────────────────────────────────────────────
const TRANSITIONS = {
  Scheduled: ['Boarding',  'Delayed',  'Cancelled'],
  Boarding:  ['Departed',  'Delayed',  'Cancelled'],
  Delayed:   ['Boarding',  'Cancelled'],
  Departed:  ['En_Route',  'Delayed'],
  En_Route:  ['Landed',    'Delayed'],
  Landed:    [],
  Cancelled: [],
  Completed: [],    // legacy — treated as terminal
};
const TERMINAL_STATES   = new Set(['Landed', 'Cancelled', 'Completed']);
const NON_EDITABLE      = new Set(['Departed', 'En_Route', 'Landed', 'Cancelled', 'Completed']);
const NON_ASSIGNABLE    = new Set(['Departed', 'En_Route', 'Landed', 'Cancelled', 'Completed']);
const VALID_SORT        = new Set(['departure_time', 'arrival_time', 'flight_id']);

// ─── Reusable SELECT fragments ────────────────────────────────────────────────
const FLIGHT_COLS = `
  f.flight_id, f.aircraft_id, f.departure_time, f.arrival_time,
  f.source_airport_code, f.dest_airport_code, f.created_at, f.updated_at,
  COALESCE(fs.status, 'Scheduled') AS status,
  fs.schedule_id, fs.schedule_date, fs.delay_reason,
  ac.model AS aircraft_model, ac.manufacturer AS aircraft_manufacturer,
  src.name AS source_airport_name, src.city AS source_city,
  dst.name AS dest_airport_name,  dst.city AS dest_city`;

const FLIGHT_FROM = `
  FROM flight f
  LEFT JOIN LATERAL (
    SELECT schedule_id, status, schedule_date, delay_reason
    FROM   flight_schedule
    WHERE  flight_id = f.flight_id
    ORDER  BY schedule_date DESC LIMIT 1
  ) fs ON TRUE
  LEFT JOIN aircraft ac  ON ac.aircraft_id   = f.aircraft_id
  LEFT JOIN airport  src ON src.airport_code = f.source_airport_code
  LEFT JOIN airport  dst ON dst.airport_code = f.dest_airport_code`;

// ─── Internal helpers ─────────────────────────────────────────────────────────

const checkAircraftAvailability = async (client, aircraftId, depTime, arrTime, excludeFlightId = null) => {
  const { rows: [ac] } = await client.query(
    'SELECT status FROM aircraft WHERE aircraft_id = $1', [aircraftId]
  );
  if (!ac) throw AppError.notFound('Aircraft not found');
  if (ac.status !== 'Active') {
    throw AppError.conflict(`Aircraft is '${ac.status}' and cannot be scheduled`);
  }

  const base   = [aircraftId, depTime, arrTime];
  const clause = excludeFlightId ? `AND f.flight_id != $4` : '';
  if (excludeFlightId) base.push(excludeFlightId);

  const { rows: conflicts } = await client.query(
    `SELECT f.flight_id, f.departure_time, f.arrival_time
     FROM   flight f
     JOIN   flight_schedule fs ON fs.flight_id = f.flight_id
     WHERE  f.aircraft_id = $1
       ${clause}
       AND fs.status NOT IN ('Cancelled','Completed')
       AND (f.departure_time, f.arrival_time) OVERLAPS ($2::timestamptz, $3::timestamptz)
     LIMIT 1`,
    base
  );
  if (conflicts.length) {
    const c = conflicts[0];
    throw AppError.conflict(
      `Aircraft conflict: already scheduled for flight ${c.flight_id} ` +
      `(${new Date(c.departure_time).toISOString()} – ${new Date(c.arrival_time).toISOString()})`
    );
  }
};

const getLatestSchedule = async (client, flightId) => {
  const { rows } = await client.query(
    `SELECT * FROM flight_schedule WHERE flight_id = $1 ORDER BY schedule_date DESC LIMIT 1`,
    [flightId]
  );
  return rows[0] || null;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

const list = async (req, res, next) => {
  try {
    const {
      status, source, dest, aircraft_id,
      from_date, to_date,
      sort_by = 'departure_time', order = 'asc',
    } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (status)      { conds.push(`COALESCE(fs.status,'Scheduled') = $${idx}`); params.push(status);                   idx++; }
    if (source)      { conds.push(`f.source_airport_code = $${idx}`);           params.push(source.toUpperCase());     idx++; }
    if (dest)        { conds.push(`f.dest_airport_code   = $${idx}`);           params.push(dest.toUpperCase());       idx++; }
    if (aircraft_id) { conds.push(`f.aircraft_id = $${idx}`);                   params.push(aircraft_id);             idx++; }
    if (from_date)   { conds.push(`f.departure_time >= $${idx}::date`);         params.push(from_date);               idx++; }
    if (to_date)     { conds.push(`f.departure_time <  ($${idx}::date + 1)`);   params.push(to_date);                 idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? `f.${sort_by}` : 'f.departure_time';
    const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${FLIGHT_FROM} ${where}`, params),
      pool.query(
        `SELECT ${FLIGHT_COLS} ${FLIGHT_FROM} ${where}
         ORDER BY ${col} ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

const today = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${FLIGHT_COLS} ${FLIGHT_FROM}
       WHERE DATE(f.departure_time) = CURRENT_DATE
       ORDER BY f.departure_time ASC`
    );
    return ApiResponse.success(res, rows);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: flightRows } = await pool.query(
      `SELECT ${FLIGHT_COLS} ${FLIGHT_FROM} WHERE f.flight_id = $1`, [id]
    );
    if (!flightRows.length) return next(AppError.notFound('Flight not found'));

    const [scheduleRows, crewRows] = await Promise.all([
      pool.query(
        `SELECT * FROM flight_schedule WHERE flight_id = $1 ORDER BY schedule_date DESC`, [id]
      ),
      pool.query(
        `SELECT ca.emp_id, ca.assignment_date, ca.role AS assignment_role,
                e.name, e.role AS employee_role, e.status AS employee_status,
                p.rank AS pilot_rank, p.fitness AS pilot_fitness,
                cc.fitness AS crew_fitness
         FROM   crew_assignment ca
         JOIN   employee e  ON e.emp_id  = ca.emp_id
         LEFT JOIN pilot       p  ON p.emp_id  = ca.emp_id
         LEFT JOIN cabin_crew  cc ON cc.emp_id = ca.emp_id
         WHERE  ca.flight_id = $1
         ORDER  BY ca.role, e.name`, [id]
      ),
    ]);

    return ApiResponse.success(res, {
      ...flightRows[0],
      schedules: scheduleRows.rows,
      crew:      crewRows.rows,
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { aircraft_id, departure_time, arrival_time, source_airport_code, dest_airport_code } = req.body;
    const src = source_airport_code.toUpperCase();
    const dst = dest_airport_code.toUpperCase();

    if (src === dst) {
      await client.query('ROLLBACK');
      return next(AppError.badRequest('Source and destination airports must be different'));
    }
    if (new Date(arrival_time) <= new Date(departure_time)) {
      await client.query('ROLLBACK');
      return next(AppError.badRequest('Arrival time must be after departure time'));
    }

    const [srcRes, dstRes] = await Promise.all([
      client.query('SELECT 1 FROM airport WHERE airport_code = $1', [src]),
      client.query('SELECT 1 FROM airport WHERE airport_code = $1', [dst]),
    ]);
    if (!srcRes.rows.length) { await client.query('ROLLBACK'); return next(AppError.badRequest(`Source airport '${src}' not found`)); }
    if (!dstRes.rows.length) { await client.query('ROLLBACK'); return next(AppError.badRequest(`Destination airport '${dst}' not found`)); }

    try {
      await checkAircraftAvailability(client, aircraft_id, departure_time, arrival_time);
    } catch (err) {
      await client.query('ROLLBACK');
      return next(err);
    }

    const { rows: [flight] } = await client.query(
      `INSERT INTO flight (aircraft_id, departure_time, arrival_time, source_airport_code, dest_airport_code)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [aircraft_id, departure_time, arrival_time, src, dst]
    );

    const schedDate = new Date(departure_time).toISOString().slice(0, 10);
    const { rows: [sched] } = await client.query(
      `INSERT INTO flight_schedule (flight_id, schedule_date, status) VALUES ($1, $2, 'Scheduled') RETURNING *`,
      [flight.flight_id, schedDate]
    );

    await client.query('COMMIT');
    return ApiResponse.created(res, { ...flight, status: sched.status, schedule_date: sched.schedule_date, schedule_id: sched.schedule_id });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const update = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { aircraft_id, departure_time, arrival_time } = req.body;

    const { rows: cur } = await client.query(
      `SELECT f.*, COALESCE(fs.status,'Scheduled') AS schedule_status
       FROM   flight f
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       WHERE f.flight_id = $1`, [id]
    );
    if (!cur.length) { await client.query('ROLLBACK'); return next(AppError.notFound('Flight not found')); }

    if (NON_EDITABLE.has(cur[0].schedule_status)) {
      await client.query('ROLLBACK');
      return next(AppError.conflict(`Cannot update a flight in '${cur[0].schedule_status}' status`));
    }

    const newAc  = aircraft_id    || cur[0].aircraft_id;
    const newDep = departure_time || cur[0].departure_time;
    const newArr = arrival_time   || cur[0].arrival_time;

    if (new Date(newArr) <= new Date(newDep)) {
      await client.query('ROLLBACK');
      return next(AppError.badRequest('Arrival time must be after departure time'));
    }

    try {
      await checkAircraftAvailability(client, newAc, newDep, newArr, id);
    } catch (err) {
      await client.query('ROLLBACK');
      return next(err);
    }

    const { rows: [updated] } = await client.query(
      `UPDATE flight
       SET aircraft_id    = COALESCE($1, aircraft_id),
           departure_time = COALESCE($2::timestamptz, departure_time),
           arrival_time   = COALESCE($3::timestamptz, arrival_time),
           updated_at     = NOW()
       WHERE flight_id = $4 RETURNING *`,
      [aircraft_id ?? null, departure_time ?? null, arrival_time ?? null, id]
    );

    await client.query('COMMIT');
    return ApiResponse.success(res, updated);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id }                               = req.params;
    const { status, delay_reason, emp_id }     = req.body;

    const sched = await getLatestSchedule(pool, id);
    if (!sched) return next(AppError.notFound('Flight or schedule not found'));

    // UC-12: if emp_id provided, validate the employee is assigned to this flight
    if (emp_id) {
      const { rows: assigned } = await pool.query(
        'SELECT 1 FROM crew_assignment WHERE emp_id = $1 AND flight_id = $2',
        [emp_id, id]
      );
      if (!assigned.length) {
        return next(AppError.forbidden(
          'Employee is not assigned to this flight and cannot update its status'
        ));
      }
    }

    const allowed = TRANSITIONS[sched.status] || [];
    if (!allowed.includes(status)) {
      return next(AppError.badRequest(
        `Invalid transition: ${sched.status} → ${status}. ` +
        `Allowed next states: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`
      ));
    }

    const { rows: [updated] } = await pool.query(
      `UPDATE flight_schedule
       SET status              = $1,
           delay_reason        = COALESCE($2, delay_reason),
           updated_by_emp_id   = COALESCE($3, updated_by_emp_id),
           status_updated_at   = NOW(),
           updated_at          = NOW()
       WHERE schedule_id = $4 RETURNING *`,
      [status, delay_reason ?? null, emp_id ?? null, sched.schedule_id]
    );

    // ── Lab 07 boarding state machine propagation ────────────────────────────
    // Departed: Confirmed/Waitlisted passengers who didn't check in → No_Show
    if (status === 'Departed') {
      await pool.query(
        `UPDATE reservation SET status = 'No_Show', updated_at = NOW()
         WHERE flight_id = $1 AND status IN ('Confirmed','Waitlisted')`,
        [id]
      );
    }
    // Landed: Checked_In reservations → Completed (flight done)
    if (status === 'Landed' || status === 'Completed') {
      await pool.query(
        `UPDATE reservation SET status = 'Completed', updated_at = NOW()
         WHERE flight_id = $1 AND status = 'Checked_In'`,
        [id]
      );
    }

    return ApiResponse.success(res, updated, `Flight status updated to ${status}`);
  } catch (err) { next(err); }
};

module.exports = { list, today, getById, create, update, updateStatus };
