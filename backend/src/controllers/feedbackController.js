const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

// Flight must be in one of these states to accept feedback
const REVIEWABLE_STATES = new Set(['Departed', 'En_Route', 'Landed', 'Completed']);

// ─── Submit feedback (UC-07) ──────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { passenger_id, flight_id, rating, comments } = req.body;

    // 1. Flight must be active or completed
    const { rows: [fl] } = await pool.query(
      `SELECT COALESCE(fs.status,'Scheduled') AS status
       FROM flight f
       LEFT JOIN LATERAL (
         SELECT status FROM flight_schedule WHERE flight_id = f.flight_id
         ORDER BY schedule_date DESC LIMIT 1
       ) fs ON TRUE
       WHERE f.flight_id = $1`,
      [flight_id]
    );
    if (!fl) return next(AppError.notFound('Flight not found'));
    if (!REVIEWABLE_STATES.has(fl.status)) {
      return next(AppError.badRequest(
        `Feedback can only be submitted for active or completed flights. ` +
        `Current flight status: '${fl.status}'`
      ));
    }

    // 2. Passenger must have boarded (Checked_In or Completed reservation)
    const { rows: boarded } = await pool.query(
      `SELECT 1 FROM reservation
       WHERE passenger_id = $1 AND flight_id = $2
         AND status IN ('Checked_In','Completed')`,
      [passenger_id, flight_id]
    );
    if (!boarded.length) {
      return next(AppError.forbidden(
        'Feedback can only be submitted by passengers who boarded this flight'
      ));
    }

    // 3. Rating range guard (DB CHECK 1–5 also enforces, but give a clear message)
    if (rating < 1 || rating > 5) {
      return next(AppError.badRequest('Rating must be between 1 and 5'));
    }

    // 4. Insert — UNIQUE(passenger_id, flight_id) → 409 on duplicate
    const { rows: [feedback] } = await pool.query(
      `INSERT INTO feedback (passenger_id, flight_id, rating, comments)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [passenger_id, flight_id, rating, comments ?? null]
    );

    return ApiResponse.created(res, feedback);
  } catch (err) { next(err); }
};

// ─── Passenger portal: own feedback history ───────────────────────────────────
const getByPassenger = async (req, res, next) => {
  try {
    const { empId, id }           = req.params;          // routes differ for passenger vs admin
    const passengerId             = id || empId;
    const { page, limit, offset } = parsePagination(req.query);

    const [countRes, dataRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM feedback WHERE passenger_id = $1', [passengerId]),
      pool.query(
        `SELECT fb.*,
                f.departure_time, f.arrival_time,
                f.source_airport_code, f.dest_airport_code,
                src.name AS source_airport_name, src.city AS source_city,
                dst.name AS dest_airport_name,   dst.city AS dest_city
         FROM feedback fb
         JOIN flight  f   ON f.flight_id   = fb.flight_id
         LEFT JOIN airport src ON src.airport_code = f.source_airport_code
         LEFT JOIN airport dst ON dst.airport_code = f.dest_airport_code
         WHERE fb.passenger_id = $1
         ORDER BY fb.feedback_date DESC
         LIMIT $2 OFFSET $3`,
        [passengerId, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── Admin: list all feedback (filterable) ────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { flight_id, passenger_id, from_date, to_date, min_rating, max_rating } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (flight_id)    { conds.push(`fb.flight_id    = $${idx}`);               params.push(flight_id);    idx++; }
    if (passenger_id) { conds.push(`fb.passenger_id = $${idx}`);               params.push(passenger_id); idx++; }
    if (from_date)    { conds.push(`fb.feedback_date >= $${idx}::date`);        params.push(from_date);    idx++; }
    if (to_date)      { conds.push(`fb.feedback_date <= $${idx}::date`);        params.push(to_date);      idx++; }
    if (min_rating)   { conds.push(`fb.rating >= $${idx}`);                    params.push(min_rating);   idx++; }
    if (max_rating)   { conds.push(`fb.rating <= $${idx}`);                    params.push(max_rating);   idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM feedback fb ${where}`, params),
      pool.query(
        `SELECT
           fb.*,
           p.name  AS passenger_name,
           p.email AS passenger_email,
           f.departure_time, f.arrival_time,
           f.source_airport_code, f.dest_airport_code,
           src.name AS source_airport_name,
           dst.name AS dest_airport_name
         FROM feedback fb
         JOIN passenger p ON p.passenger_id = fb.passenger_id
         JOIN flight    f ON f.flight_id    = fb.flight_id
         LEFT JOIN airport src ON src.airport_code = f.source_airport_code
         LEFT JOIN airport dst ON dst.airport_code = f.dest_airport_code
         ${where}
         ORDER BY fb.feedback_date DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── Admin: analytics — overall + per-flight ratings ─────────────────────────
const analytics = async (req, res, next) => {
  try {
    const { flight_id, from_date, to_date } = req.query;

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (flight_id) { conds.push(`fb.flight_id    = $${idx}`);           params.push(flight_id); idx++; }
    if (from_date) { conds.push(`fb.feedback_date >= $${idx}::date`);   params.push(from_date); idx++; }
    if (to_date)   { conds.push(`fb.feedback_date <= $${idx}::date`);   params.push(to_date);   idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [overallRes, byFlightRes, distributionRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                              AS total_reviews,
           ROUND(AVG(rating), 2)                                AS avg_rating,
           COUNT(CASE WHEN rating = 5  THEN 1 END)              AS five_star,
           COUNT(CASE WHEN rating = 4  THEN 1 END)              AS four_star,
           COUNT(CASE WHEN rating = 3  THEN 1 END)              AS three_star,
           COUNT(CASE WHEN rating <= 2 THEN 1 END)              AS low_rated
         FROM feedback fb ${where}`,
        params
      ),
      pool.query(
        `SELECT
           fb.flight_id,
           f.departure_time, f.source_airport_code, f.dest_airport_code,
           COUNT(*)                  AS total_reviews,
           ROUND(AVG(fb.rating), 2) AS avg_rating,
           MIN(fb.rating)           AS min_rating,
           MAX(fb.rating)           AS max_rating
         FROM feedback fb
         JOIN flight f ON f.flight_id = fb.flight_id
         ${where}
         GROUP BY fb.flight_id, f.departure_time, f.source_airport_code, f.dest_airport_code
         ORDER BY avg_rating DESC, total_reviews DESC
         ${flight_id ? '' : 'LIMIT 20'}`,
        params
      ),
      pool.query(
        `SELECT rating, COUNT(*) AS count
         FROM feedback fb ${where}
         GROUP BY rating ORDER BY rating DESC`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:      overallRes.rows[0],
      by_flight:    byFlightRes.rows,
      distribution: distributionRes.rows,
    });
  } catch (err) { next(err); }
};

module.exports = { create, list, getByPassenger, analytics };
