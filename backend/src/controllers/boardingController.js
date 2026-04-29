const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

// States where ground staff can actively perform boarding actions
const BOARDABLE_FLIGHT_STATES = new Set(['Boarding']);

// Reservation states that count as "not yet boarded"
const UNBOARDED_STATUSES = ['Confirmed', 'Waitlisted'];

const MANIFEST_SORT = new Map([
  ['seat_no',        'r.seat_no'],
  ['passenger_name', 'p.name'],
  ['boarding_status','r.status'],
  ['pnr_id',         'r.pnr_id'],
]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

const getFlightStatus = async (client, flightId) => {
  const { rows: [row] } = await client.query(
    `SELECT f.flight_id, f.departure_time,
            COALESCE(fs.status,'Scheduled') AS flight_status
     FROM flight f
     LEFT JOIN LATERAL (
       SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
       ORDER BY schedule_date DESC LIMIT 1
     ) fs ON TRUE
     WHERE f.flight_id = $1`,
    [flightId]
  );
  return row || null;
};

// Pre-auth: validate employee is an active Ground_Staff (UC-15 access scope)
const assertGroundStaff = async (client, empId) => {
  const { rows: [emp] } = await client.query(
    'SELECT role, status FROM employee WHERE emp_id = $1', [empId]
  );
  if (!emp) throw AppError.notFound('Employee not found');
  if (emp.status !== 'Active') {
    throw AppError.badRequest(
      `Employee is '${emp.status}' and cannot perform boarding operations`
    );
  }
  if (emp.role !== 'Ground_Staff') {
    throw AppError.forbidden('Only Ground Staff can perform boarding operations');
  }
};

// ─── GET /boarding/:flightId/manifest ────────────────────────────────────────
// Paginated, searchable manifest — ready for large flights
const getManifest = async (req, res, next) => {
  try {
    const { flightId }                = req.params;
    const { search, status, sort_by = 'seat_no', order = 'asc' } = req.query;
    const { page, limit, offset }     = parsePagination(req.query);

    const conds  = ['r.flight_id = $1'];
    const params = [flightId];
    let   idx    = 2;

    if (search) {
      conds.push(
        `(p.name ILIKE $${idx} OR r.seat_no ILIKE $${idx} OR p.passport_no ILIKE $${idx})`
      );
      params.push(`%${search}%`);
      idx++;
    }
    if (status) { conds.push(`r.status = $${idx}`); params.push(status); idx++; }

    const where = `WHERE ${conds.join(' AND ')}`;
    const col   = MANIFEST_SORT.get(sort_by) || 'r.seat_no';
    const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const BASE_FROM = `
      FROM reservation r
      JOIN passenger p ON p.passenger_id = r.passenger_id
      JOIN flight    f ON f.flight_id    = r.flight_id
      LEFT JOIN LATERAL (
        SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
        ORDER BY schedule_date DESC LIMIT 1
      ) fs ON TRUE`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${BASE_FROM} ${where}`, params),
      pool.query(
        `SELECT
           r.pnr_id, r.seat_no, r.booking_date,
           r.status       AS boarding_status,
           r.updated_at   AS status_updated_at,
           p.passenger_id, p.name AS passenger_name,
           p.contact, p.email, p.passport_no,
           f.flight_id, f.departure_time, f.arrival_time,
           f.source_airport_code, f.dest_airport_code,
           COALESCE(fs.status,'Scheduled') AS flight_status
         ${BASE_FROM} ${where}
         ORDER BY ${col} ${dir}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── GET /boarding/:flightId/status ──────────────────────────────────────────
// Real-time boarding progress summary for the ground staff screen
const getBoardingStatus = async (req, res, next) => {
  try {
    const { flightId } = req.params;

    const fl = await getFlightStatus(pool, flightId);
    if (!fl) return next(AppError.notFound('Flight not found'));

    const { rows: [stats] } = await pool.query(
      `SELECT
         COUNT(*)                                              AS total_booked,
         COUNT(CASE WHEN status = 'Checked_In'  THEN 1 END)  AS boarded,
         COUNT(CASE WHEN status = 'Confirmed'   THEN 1 END)  AS pending_boarding,
         COUNT(CASE WHEN status = 'Waitlisted'  THEN 1 END)  AS waitlisted,
         COUNT(CASE WHEN status = 'No_Show'     THEN 1 END)  AS no_show,
         COUNT(CASE WHEN status = 'Cancelled'   THEN 1 END)  AS cancelled,
         COUNT(CASE WHEN status = 'Completed'   THEN 1 END)  AS completed
       FROM reservation WHERE flight_id = $1`,
      [flightId]
    );

    const total    = parseInt(stats.total_booked);
    const boarded  = parseInt(stats.boarded);
    const boarding_pct = total > 0 ? Math.round((boarded / total) * 100) : 0;

    return ApiResponse.success(res, {
      flight_id:       fl.flight_id,
      flight_status:   fl.flight_status,
      departure_time:  fl.departure_time,
      boarding_open:   fl.flight_status === 'Boarding',
      total_booked:    total,
      boarded,
      boarding_pct,
      ...stats,
    });
  } catch (err) { next(err); }
};

// ─── PATCH /boarding/:flightId/check-in/:pnrId ───────────────────────────────
// Confirm a single passenger has boarded (UC-16)
const checkIn = async (req, res, next) => {
  try {
    const { flightId, pnrId } = req.params;
    const { emp_id }          = req.body;

    // Access scope: Ground Staff only (pre-auth)
    if (emp_id) {
      try { await assertGroundStaff(pool, emp_id); }
      catch (err) { return next(err); }
    }

    // 1. Flight must be open for boarding
    const fl = await getFlightStatus(pool, flightId);
    if (!fl) return next(AppError.notFound('Flight not found'));
    if (!BOARDABLE_FLIGHT_STATES.has(fl.flight_status)) {
      return next(AppError.conflict(
        `Boarding is not open. Flight is currently '${fl.flight_status}'`
      ));
    }

    // 2. Reservation must exist on this flight
    const { rows: [res_] } = await pool.query(
      'SELECT * FROM reservation WHERE pnr_id = $1 AND flight_id = $2',
      [pnrId, flightId]
    );
    if (!res_) return next(AppError.notFound('Reservation not found for this flight'));

    // 3. Must be Confirmed to board (not already Checked_In or terminal)
    if (res_.status !== 'Confirmed') {
      return next(AppError.badRequest(
        `Reservation is '${res_.status}' — only Confirmed reservations can be checked in`
      ));
    }

    // 4. Passenger must be Active
    const { rows: [pax] } = await pool.query(
      'SELECT status FROM passenger WHERE passenger_id = $1', [res_.passenger_id]
    );
    if (pax && pax.status !== 'Active') {
      return next(AppError.badRequest(
        `Passenger is '${pax.status}' and cannot board`
      ));
    }

    // 5. Update → Checked_In
    const { rows: [updated] } = await pool.query(
      `UPDATE reservation SET status = 'Checked_In', updated_at = NOW()
       WHERE pnr_id = $1 RETURNING *`,
      [pnrId]
    );

    return ApiResponse.success(res, updated, 'Passenger checked in successfully');
  } catch (err) { next(err); }
};

// ─── POST /boarding/:flightId/close ──────────────────────────────────────────
// Close boarding window — marks remaining unboarded as No_Show and returns alert list
const closeBoarding = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { flightId } = req.params;
    const { emp_id }   = req.body;

    // Access scope
    if (emp_id) {
      try { await assertGroundStaff(client, emp_id); }
      catch (err) { await client.query('ROLLBACK'); return next(err); }
    }

    // Flight must be in Boarding state
    const fl = await getFlightStatus(client, flightId);
    if (!fl) { await client.query('ROLLBACK'); return next(AppError.notFound('Flight not found')); }
    if (fl.flight_status !== 'Boarding') {
      await client.query('ROLLBACK');
      return next(AppError.conflict(
        `Boarding can only be closed when the flight is in 'Boarding' state. ` +
        `Current: '${fl.flight_status}'`
      ));
    }

    // Mark all Confirmed/Waitlisted as No_Show and immediately return passenger details
    const { rows: noShows } = await client.query(
      `WITH updated AS (
         UPDATE reservation
         SET status = 'No_Show', updated_at = NOW()
         WHERE flight_id = $1 AND status = ANY($2::reservation_status[])
         RETURNING pnr_id, passenger_id, seat_no
       )
       SELECT u.pnr_id, u.seat_no,
              p.name AS passenger_name, p.contact, p.email, p.passport_no
       FROM updated u
       JOIN passenger p ON p.passenger_id = u.passenger_id
       ORDER BY u.seat_no`,
      [flightId, UNBOARDED_STATUSES]
    );

    // Final boarding stats
    const { rows: [stats] } = await client.query(
      `SELECT
         COUNT(CASE WHEN status = 'Checked_In' THEN 1 END) AS boarded,
         COUNT(CASE WHEN status = 'No_Show'    THEN 1 END) AS no_show,
         COUNT(*)                                          AS total_booked
       FROM reservation WHERE flight_id = $1`,
      [flightId]
    );

    await client.query('COMMIT');

    return ApiResponse.success(res, {
      flight_id:      parseInt(flightId),
      boarding_closed: true,
      no_show_count:  noShows.length,
      boarded_count:  parseInt(stats.boarded),
      total_booked:   parseInt(stats.total_booked),
      no_show_alerts: noShows,   // ground staff alert list for follow-up
    }, `Boarding closed — ${noShows.length} passenger(s) marked as No_Show`);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// ─── GET /boarding/:flightId/alerts ──────────────────────────────────────────
// Not-boarded alert list — shows pending and already-marked No_Show passengers
const getAlerts = async (req, res, next) => {
  try {
    const { flightId } = req.params;

    const { rows } = await pool.query(
      `SELECT r.pnr_id, r.seat_no, r.status, r.updated_at AS status_updated_at,
              p.passenger_id, p.name AS passenger_name,
              p.contact, p.email, p.passport_no
       FROM reservation r
       JOIN passenger p ON p.passenger_id = r.passenger_id
       WHERE r.flight_id = $1
         AND r.status IN ('Confirmed','Waitlisted','No_Show')
       ORDER BY r.status, r.seat_no`,
      [flightId]
    );

    const pending = rows.filter(r => r.status === 'Confirmed' || r.status === 'Waitlisted');
    const noShows = rows.filter(r => r.status === 'No_Show');

    return ApiResponse.success(res, {
      flight_id:      parseInt(flightId),
      pending_count:  pending.length,
      no_show_count:  noShows.length,
      pending,
      no_shows:       noShows,
    });
  } catch (err) { next(err); }
};

module.exports = { getManifest, getBoardingStatus, checkIn, closeBoarding, getAlerts };
