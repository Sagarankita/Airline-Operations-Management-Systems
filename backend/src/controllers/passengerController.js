const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

const VALID_SORT = new Set(['passenger_id', 'name', 'status', 'created_at']);

// ─── Admin: list passengers ───────────────────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { search, status, gender, sort_by = 'passenger_id', order = 'asc' } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (search) {
      conds.push(
        `(name ILIKE $${idx} OR contact ILIKE $${idx} OR email ILIKE $${idx} ` +
        `OR CAST(passenger_id AS TEXT) = $${idx + 1})`
      );
      params.push(`%${search}%`, search.replace(/\D/g, '') || '0');
      idx += 2;
    }
    if (status) { conds.push(`status = $${idx}`);              params.push(status); idx++; }
    if (gender) { conds.push(`gender = $${idx}::gender_type`); params.push(gender); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? sort_by : 'passenger_id';
    const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM passenger ${where}`, params),
      pool.query(
        `SELECT * FROM passenger ${where} ORDER BY ${col} ${dir}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── Get passenger with recent reservation summary ────────────────────────────
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows: [passenger] } = await pool.query(
      'SELECT * FROM passenger WHERE passenger_id = $1', [id]
    );
    if (!passenger) return next(AppError.notFound('Passenger not found'));

    const { rows: recent } = await pool.query(
      `SELECT r.pnr_id, r.flight_id, r.seat_no, r.booking_date, r.status,
              f.departure_time, f.arrival_time,
              f.source_airport_code, f.dest_airport_code,
              COALESCE(fs.status,'Scheduled') AS flight_status
       FROM   reservation r
       JOIN   flight f ON f.flight_id = r.flight_id
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       WHERE  r.passenger_id = $1
       ORDER  BY r.created_at DESC
       LIMIT  5`,
      [id]
    );

    return ApiResponse.success(res, { ...passenger, recent_reservations: recent });
  } catch (err) { next(err); }
};

// ─── Create passenger ─────────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { name, gender, passport_no, contact, email } = req.body;
    const { rows: [passenger] } = await pool.query(
      `INSERT INTO passenger (name, gender, passport_no, contact, email)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, gender, passport_no ?? null, contact, email]
    );
    return ApiResponse.created(res, passenger);
  } catch (err) { next(err); }
};

// ─── Update passenger profile ─────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { id }                                           = req.params;
    const { name, gender, passport_no, contact, email }   = req.body;
    const { rows: [passenger] } = await pool.query(
      `UPDATE passenger
       SET name        = COALESCE($1, name),
           gender      = COALESCE($2::gender_type, gender),
           passport_no = COALESCE($3, passport_no),
           contact     = COALESCE($4, contact),
           email       = COALESCE($5, email),
           updated_at  = NOW()
       WHERE passenger_id = $6 RETURNING *`,
      [name ?? null, gender ?? null, passport_no ?? null, contact ?? null, email ?? null, id]
    );
    if (!passenger) return next(AppError.notFound('Passenger not found'));
    return ApiResponse.success(res, passenger);
  } catch (err) { next(err); }
};

// ─── Soft lifecycle: deactivate / reactivate / blacklist ──────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const { rows: [passenger] } = await pool.query(
      `UPDATE passenger SET status = $1, updated_at = NOW()
       WHERE passenger_id = $2 RETURNING *`,
      [status, id]
    );
    if (!passenger) return next(AppError.notFound('Passenger not found'));
    return ApiResponse.success(res, passenger);
  } catch (err) { next(err); }
};

// ─── Passenger portal: own booking history ────────────────────────────────────
const getMyReservations = async (req, res, next) => {
  try {
    const { id }                  = req.params;
    const { status, upcoming }    = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = ['r.passenger_id = $1'];
    const params = [id];
    let   idx    = 2;

    if (status)           { conds.push(`r.status = $${idx}`); params.push(status); idx++; }
    if (upcoming === 'true') { conds.push(`f.departure_time > NOW()`); }

    const where = `WHERE ${conds.join(' AND ')}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)
         FROM reservation r JOIN flight f ON f.flight_id = r.flight_id ${where}`,
        params
      ),
      pool.query(
        `SELECT
           r.pnr_id, r.passenger_id, r.flight_id, r.seat_no,
           r.booking_date, r.status AS reservation_status,
           r.created_at, r.updated_at,
           f.departure_time, f.arrival_time,
           f.source_airport_code, f.dest_airport_code,
           COALESCE(fs.status,'Scheduled') AS flight_status,
           fs.delay_reason,
           src.name AS source_airport_name, src.city AS source_city,
           dst.name AS dest_airport_name,   dst.city AS dest_city,
           ac.model AS aircraft_model
         FROM reservation r
         JOIN flight    f   ON f.flight_id   = r.flight_id
         LEFT JOIN LATERAL (
           SELECT status, delay_reason FROM flight_schedule WHERE flight_id = f.flight_id
           ORDER BY schedule_date DESC LIMIT 1
         ) fs ON TRUE
         LEFT JOIN airport  src ON src.airport_code = f.source_airport_code
         LEFT JOIN airport  dst ON dst.airport_code = f.dest_airport_code
         LEFT JOIN aircraft ac  ON ac.aircraft_id   = f.aircraft_id
         ${where}
         ORDER BY f.departure_time DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, updateStatus, getMyReservations };
