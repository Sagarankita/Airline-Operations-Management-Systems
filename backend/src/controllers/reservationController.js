const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

// ─── Lab 07 Reservation / Boarding state machine ──────────────────────────────
const TRANSITIONS = {
  Confirmed:  ['Checked_In', 'Cancelled', 'No_Show', 'Completed'],
  Waitlisted: ['Confirmed',  'Cancelled'],
  Checked_In: ['Completed'],
  Cancelled:  [],   // terminal
  Completed:  [],   // terminal
  No_Show:    [],   // terminal (auto-set on Departed)
};

const BOOKABLE_FLIGHT_STATES = new Set(['Scheduled', 'Boarding', 'Delayed']);
const VALID_SORT = new Set(['pnr_id', 'booking_date', 'status', 'created_at']);

// ─── Shared rich SELECT for reservation lists ─────────────────────────────────
const RES_COLS = `
  r.pnr_id, r.passenger_id, r.flight_id, r.seat_no,
  r.booking_date, r.status AS reservation_status,
  r.created_at, r.updated_at,
  p.name AS passenger_name, p.email AS passenger_email, p.contact AS passenger_contact,
  f.departure_time, f.arrival_time,
  f.source_airport_code, f.dest_airport_code,
  COALESCE(fs.status,'Scheduled') AS flight_status,
  fs.delay_reason,
  src.name AS source_airport_name, src.city AS source_city,
  dst.name AS dest_airport_name,   dst.city AS dest_city`;

const RES_FROM = `
  FROM reservation r
  JOIN passenger p ON p.passenger_id = r.passenger_id
  JOIN flight    f ON f.flight_id    = r.flight_id
  LEFT JOIN LATERAL (
    SELECT status, delay_reason FROM flight_schedule WHERE flight_id = f.flight_id
    ORDER BY schedule_date DESC LIMIT 1
  ) fs ON TRUE
  LEFT JOIN airport src ON src.airport_code = f.source_airport_code
  LEFT JOIN airport dst ON dst.airport_code = f.dest_airport_code`;

// ─── Admin: list all reservations ────────────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { passenger_id, flight_id, status, from_date, to_date,
            sort_by = 'pnr_id', order = 'asc' } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (passenger_id) { conds.push(`r.passenger_id = $${idx}`);                     params.push(passenger_id); idx++; }
    if (flight_id)    { conds.push(`r.flight_id    = $${idx}`);                     params.push(flight_id);    idx++; }
    if (status)       { conds.push(`r.status       = $${idx}`);                     params.push(status);       idx++; }
    if (from_date)    { conds.push(`r.booking_date >= $${idx}::date`);              params.push(from_date);    idx++; }
    if (to_date)      { conds.push(`r.booking_date <= $${idx}::date`);              params.push(to_date);      idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? `r.${sort_by}` : 'r.pnr_id';
    const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${RES_FROM} ${where}`, params),
      pool.query(
        `SELECT ${RES_COLS} ${RES_FROM} ${where}
         ORDER BY ${col} ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── Single reservation ───────────────────────────────────────────────────────
const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${RES_COLS} ${RES_FROM} WHERE r.pnr_id = $1`, [req.params.id]
    );
    if (!rows.length) return next(AppError.notFound('Reservation not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

// ─── Create reservation (seat conflict + duplicate + passenger/flight guards) ─
const create = async (req, res, next) => {
  try {
    const { passenger_id, flight_id, seat_no } = req.body;

    // 1. Passenger must be Active
    const { rows: [pax] } = await pool.query(
      'SELECT status FROM passenger WHERE passenger_id = $1', [passenger_id]
    );
    if (!pax) return next(AppError.notFound('Passenger not found'));
    if (pax.status !== 'Active') {
      return next(AppError.badRequest(
        `Passenger is '${pax.status}' and cannot make reservations`
      ));
    }

    // 2. Flight must exist and be in a bookable state
    const { rows: [fl] } = await pool.query(
      `SELECT f.flight_id, COALESCE(fs.status,'Scheduled') AS schedule_status
       FROM flight f
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       WHERE f.flight_id = $1`,
      [flight_id]
    );
    if (!fl) return next(AppError.notFound('Flight not found'));
    if (!BOOKABLE_FLIGHT_STATES.has(fl.schedule_status)) {
      return next(AppError.badRequest(
        `Cannot book a flight in '${fl.schedule_status}' status`
      ));
    }

    // 3. Passenger must not already have an active booking on this flight
    const { rows: dup } = await pool.query(
      `SELECT 1 FROM reservation
       WHERE passenger_id = $1 AND flight_id = $2
         AND status NOT IN ('Cancelled','No_Show')`,
      [passenger_id, flight_id]
    );
    if (dup.length) {
      return next(AppError.conflict(
        'Passenger already has an active reservation for this flight'
      ));
    }

    // 4. Insert — UNIQUE(flight_id, seat_no) catches seat conflicts → DB 23505 → 409
    const { rows: [reservation] } = await pool.query(
      `INSERT INTO reservation (passenger_id, flight_id, seat_no)
       VALUES ($1, $2, $3) RETURNING *`,
      [passenger_id, flight_id, seat_no.toUpperCase()]
    );

    return ApiResponse.created(res, reservation);
  } catch (err) { next(err); }
};

// ─── Update reservation status (state machine) ────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const { rows: [current] } = await pool.query(
      'SELECT * FROM reservation WHERE pnr_id = $1', [id]
    );
    if (!current) return next(AppError.notFound('Reservation not found'));

    const allowed = TRANSITIONS[current.status] || [];
    if (!allowed.includes(status)) {
      return next(AppError.badRequest(
        `Invalid reservation transition: ${current.status} → ${status}. ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`
      ));
    }

    const { rows: [updated] } = await pool.query(
      `UPDATE reservation SET status = $1, updated_at = NOW()
       WHERE pnr_id = $2 RETURNING *`,
      [status, id]
    );

    return ApiResponse.success(res, updated, `Reservation status updated to ${status}`);
  } catch (err) { next(err); }
};

// ─── Admin: flight manifest (all reservations for a flight) ───────────────────
const getByFlight = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.query;

    const conds  = ['r.flight_id = $1'];
    const params = [id];
    let   idx    = 2;

    if (status) { conds.push(`r.status = $${idx}`); params.push(status); idx++; }

    const { rows } = await pool.query(
      `SELECT ${RES_COLS} ${RES_FROM}
       WHERE ${conds.join(' AND ')}
       ORDER BY r.seat_no ASC`,
      params
    );

    return ApiResponse.success(res, rows);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, updateStatus, getByFlight };
