const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

const VALID_SORT = new Set(['fuellog_id', 'fuel_date', 'fuel_loaded', 'fuel_consumed']);

// ─── Shared SELECT ────────────────────────────────────────────────────────────
const LOG_COLS = `
  fl.fuellog_id, fl.flight_id, fl.aircraft_id,
  fl.fuel_loaded, fl.fuel_consumed, fl.fuel_date,
  fl.emp_id, fl.created_at, fl.updated_at,
  ROUND(fl.fuel_loaded, 2)                                          AS fuel_loaded_rounded,
  ROUND(fl.fuel_consumed, 2)                                        AS fuel_consumed_rounded,
  CASE
    WHEN fl.fuel_consumed IS NOT NULL AND fl.fuel_loaded > 0
    THEN ROUND((fl.fuel_consumed / fl.fuel_loaded) * 100, 2)
  END                                                               AS efficiency_pct,
  ac.model AS aircraft_model, ac.manufacturer,
  f.departure_time, f.arrival_time,
  f.source_airport_code, f.dest_airport_code,
  e.name AS staff_name, e.role AS staff_role`;

const LOG_FROM = `
  FROM fuel_log fl
  JOIN aircraft ac ON ac.aircraft_id = fl.aircraft_id
  JOIN flight   f  ON f.flight_id    = fl.flight_id
  LEFT JOIN employee e ON e.emp_id   = fl.emp_id`;

// ─── Internal guard ────────────────────────────────────────────────────────────
const assertFuelStaff = async (empId) => {
  const { rows: [emp] } = await pool.query(
    'SELECT role, status FROM employee WHERE emp_id = $1', [empId]
  );
  if (!emp) throw AppError.notFound('Employee not found');
  if (emp.status !== 'Active') {
    throw AppError.badRequest(
      `Employee is '${emp.status}' and cannot log fuel records`
    );
  }
  if (emp.role !== 'Fuel_Staff') {
    throw AppError.badRequest(
      `Fuel logs must be created by Fuel_Staff employees — provided role: '${emp.role}'`
    );
  }
};

// ─── Admin summary + efficiency report — before /:id ─────────────────────────
const summary = async (req, res, next) => {
  try {
    const { from_date, to_date, aircraft_id } = req.query;

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (from_date)   { conds.push(`fl.fuel_date >= $${idx}::date`); params.push(from_date);   idx++; }
    if (to_date)     { conds.push(`fl.fuel_date <= $${idx}::date`); params.push(to_date);     idx++; }
    if (aircraft_id) { conds.push(`fl.aircraft_id = $${idx}`);      params.push(aircraft_id); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [overallRes, byAircraftRes, byDateRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                                    AS total_logs,
           ROUND(SUM(fl.fuel_loaded),   2)                            AS total_fuel_loaded,
           ROUND(SUM(fl.fuel_consumed), 2)                            AS total_fuel_consumed,
           ROUND(AVG(fl.fuel_loaded),   2)                            AS avg_fuel_per_flight,
           ROUND(
             CASE WHEN SUM(fl.fuel_loaded) > 0
               THEN (SUM(fl.fuel_consumed) / SUM(fl.fuel_loaded)) * 100
             END, 2
           )                                                           AS overall_efficiency_pct,
           COUNT(CASE WHEN fl.fuel_consumed IS NULL THEN 1 END)        AS pending_consumed_count
         FROM fuel_log fl ${where}`,
        params
      ),
      pool.query(
        `SELECT
           fl.aircraft_id,
           ac.model, ac.manufacturer,
           COUNT(*)                         AS total_logs,
           ROUND(SUM(fl.fuel_loaded), 2)    AS total_fuel_loaded,
           ROUND(SUM(fl.fuel_consumed), 2)  AS total_fuel_consumed,
           ROUND(AVG(fl.fuel_loaded), 2)    AS avg_fuel_per_flight,
           ROUND(
             CASE WHEN SUM(fl.fuel_loaded) > 0
               THEN (SUM(fl.fuel_consumed) / SUM(fl.fuel_loaded)) * 100
             END, 2
           )                                AS efficiency_pct
         FROM fuel_log fl
         JOIN aircraft ac ON ac.aircraft_id = fl.aircraft_id
         ${where}
         GROUP BY fl.aircraft_id, ac.model, ac.manufacturer
         ORDER BY total_fuel_loaded DESC`,
        params
      ),
      pool.query(
        `SELECT
           fuel_date,
           COUNT(*)                         AS logs,
           ROUND(SUM(fl.fuel_loaded), 2)    AS total_loaded,
           ROUND(SUM(fl.fuel_consumed), 2)  AS total_consumed
         FROM fuel_log fl ${where}
         GROUP BY fuel_date
         ORDER BY fuel_date DESC LIMIT 30`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:     overallRes.rows[0],
      by_aircraft: byAircraftRes.rows,
      by_date:     byDateRes.rows,
    });
  } catch (err) { next(err); }
};

// ─── Fuel history for an aircraft — before /:id ───────────────────────────────
const getByAircraft = async (req, res, next) => {
  try {
    const { aircraftId }          = req.params;
    const { from_date, to_date }  = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = ['fl.aircraft_id = $1'];
    const params = [aircraftId];
    let   idx    = 2;

    if (from_date) { conds.push(`fl.fuel_date >= $${idx}::date`); params.push(from_date); idx++; }
    if (to_date)   { conds.push(`fl.fuel_date <= $${idx}::date`); params.push(to_date);   idx++; }

    const where = `WHERE ${conds.join(' AND ')}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${LOG_FROM} ${where}`, params),
      pool.query(
        `SELECT ${LOG_COLS} ${LOG_FROM} ${where}
         ORDER BY fl.fuel_date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── Fuel log for a specific flight ───────────────────────────────────────────
const getByFlight = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${LOG_COLS} ${LOG_FROM} WHERE fl.flight_id = $1`, [req.params.flightId]
    );
    return ApiResponse.success(res, rows);
  } catch (err) { next(err); }
};

// ─── Admin list (paginated + filterable) ──────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { aircraft_id, flight_id, emp_id, from_date, to_date,
            sort_by = 'fuel_date', order = 'desc' } = req.query;
    const { page, limit, offset }                   = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (aircraft_id) { conds.push(`fl.aircraft_id = $${idx}`);         params.push(aircraft_id); idx++; }
    if (flight_id)   { conds.push(`fl.flight_id   = $${idx}`);         params.push(flight_id);   idx++; }
    if (emp_id)      { conds.push(`fl.emp_id       = $${idx}`);         params.push(emp_id);      idx++; }
    if (from_date)   { conds.push(`fl.fuel_date >= $${idx}::date`);    params.push(from_date);   idx++; }
    if (to_date)     { conds.push(`fl.fuel_date <= $${idx}::date`);    params.push(to_date);     idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? `fl.${sort_by}` : 'fl.fuel_date';
    const dir   = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${LOG_FROM} ${where}`, params),
      pool.query(
        `SELECT ${LOG_COLS} ${LOG_FROM} ${where}
         ORDER BY ${col} ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── Single record ─────────────────────────────────────────────────────────────
const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${LOG_COLS} ${LOG_FROM} WHERE fl.fuellog_id = $1`, [req.params.id]
    );
    if (!rows.length) return next(AppError.notFound('Fuel log not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

// ─── Create ────────────────────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { flight_id, aircraft_id, fuel_loaded, fuel_consumed, fuel_date, emp_id } = req.body;

    // 1. Validate aircraft is Active (not Retired/In_Maintenance — UC-18)
    const { rows: [ac] } = await pool.query(
      'SELECT status FROM aircraft WHERE aircraft_id = $1', [aircraft_id]
    );
    if (!ac) return next(AppError.notFound('Aircraft not found'));
    if (ac.status !== 'Active') {
      return next(AppError.badRequest(
        `Cannot log fuel for a '${ac.status}' aircraft`
      ));
    }

    // 2. Validate flight exists
    const { rows: [fl] } = await pool.query(
      'SELECT aircraft_id FROM flight WHERE flight_id = $1', [flight_id]
    );
    if (!fl) return next(AppError.notFound('Flight not found'));

    // 3. Aircraft-flight consistency (UC-18 key guard)
    if (fl.aircraft_id !== aircraft_id) {
      return next(AppError.badRequest(
        `Aircraft mismatch: flight ${flight_id} is operated by aircraft ${fl.aircraft_id}, ` +
        `not aircraft ${aircraft_id}`
      ));
    }

    // 4. Quantity validation (DB CHECK enforces, but give a clear message first)
    if (Number(fuel_loaded) <= 0) {
      return next(AppError.badRequest('fuel_loaded must be greater than 0'));
    }
    if (fuel_consumed !== undefined && fuel_consumed !== null && Number(fuel_consumed) < 0) {
      return next(AppError.badRequest('fuel_consumed cannot be negative'));
    }

    // 5. Validate fuel staff if provided (UC-18 access scope)
    if (emp_id) {
      try { await assertFuelStaff(emp_id); }
      catch (err) { return next(err); }
    }

    const { rows: [log] } = await pool.query(
      `INSERT INTO fuel_log (flight_id, aircraft_id, fuel_loaded, fuel_consumed, fuel_date, emp_id)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
       RETURNING *`,
      [flight_id, aircraft_id, fuel_loaded, fuel_consumed ?? null, fuel_date ?? null, emp_id ?? null]
    );

    return ApiResponse.created(res, log);
  } catch (err) { next(err); }
};

// ─── Update (primarily to record fuel_consumed after flight) ──────────────────
const update = async (req, res, next) => {
  try {
    const { id }                                          = req.params;
    const { fuel_loaded, fuel_consumed, fuel_date }       = req.body;

    if (fuel_consumed !== undefined && fuel_consumed !== null && Number(fuel_consumed) < 0) {
      return next(AppError.badRequest('fuel_consumed cannot be negative'));
    }
    if (fuel_loaded !== undefined && Number(fuel_loaded) <= 0) {
      return next(AppError.badRequest('fuel_loaded must be greater than 0'));
    }

    const { rows: [log] } = await pool.query(
      `UPDATE fuel_log
       SET fuel_loaded   = COALESCE($1::numeric, fuel_loaded),
           fuel_consumed = COALESCE($2::numeric, fuel_consumed),
           fuel_date     = COALESCE($3::date,    fuel_date),
           updated_at    = NOW()
       WHERE fuellog_id = $4 RETURNING *`,
      [fuel_loaded ?? null, fuel_consumed ?? null, fuel_date ?? null, id]
    );
    if (!log) return next(AppError.notFound('Fuel log not found'));
    return ApiResponse.success(res, log);
  } catch (err) { next(err); }
};

module.exports = { summary, getByAircraft, getByFlight, list, getById, create, update };
