const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

const MAINTENANCE_TYPES = ['Scheduled', 'Unscheduled', 'Emergency'];
const VALID_SORT = new Set(['date', 's_no', 'maintenance_type', 'aircraft_id']);

// ─── Shared SELECT ────────────────────────────────────────────────────────────
const LOG_COLS = `
  ml.s_no, ml.date, ml.title, ml.remark,
  ml.maintenance_type, ml.aircraft_id, ml.emp_id,
  ml.created_at, ml.updated_at,
  ac.model AS aircraft_model, ac.manufacturer, ac.status AS aircraft_status,
  e.name   AS staff_name,     e.role  AS staff_role, e.status AS staff_status`;

const LOG_FROM = `
  FROM maintenance_log ml
  JOIN aircraft ac ON ac.aircraft_id = ml.aircraft_id
  JOIN employee e  ON e.emp_id       = ml.emp_id`;

// ─── Internal guard ────────────────────────────────────────────────────────────
const assertMaintenanceStaff = async (empId) => {
  const { rows: [emp] } = await pool.query(
    'SELECT role, status FROM employee WHERE emp_id = $1', [empId]
  );
  if (!emp) throw AppError.notFound('Employee not found');
  if (emp.status !== 'Active') {
    throw AppError.badRequest(
      `Employee is '${emp.status}' and cannot be assigned to maintenance records`
    );
  }
  if (emp.role !== 'Maintenance') {
    throw AppError.badRequest(
      `Responsible staff must be a Maintenance employee — provided role: '${emp.role}'`
    );
  }
};

// ─── Admin summary + trend report — before /:id ───────────────────────────────
const summary = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (from_date) { conds.push(`ml.date >= $${idx}::date`); params.push(from_date); idx++; }
    if (to_date)   { conds.push(`ml.date <= $${idx}::date`); params.push(to_date);   idx++; }

    const where       = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const alertConds  = [...conds, `ml.maintenance_type IN ('Emergency','Unscheduled')`];
    const alertWhere  = `WHERE ${alertConds.join(' AND ')}`;

    const [overallRes, byTypeRes, byAircraftRes, criticalRes] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)                                                        AS total_records,
           COUNT(CASE WHEN maintenance_type = 'Emergency'    THEN 1 END)  AS emergency_count,
           COUNT(CASE WHEN maintenance_type = 'Unscheduled'  THEN 1 END)  AS unscheduled_count,
           COUNT(CASE WHEN maintenance_type = 'Scheduled'    THEN 1 END)  AS scheduled_count
         FROM maintenance_log ml ${where}`,
        params
      ),
      pool.query(
        `SELECT maintenance_type, COUNT(*) AS count
         FROM maintenance_log ml ${where}
         GROUP BY maintenance_type ORDER BY count DESC`,
        params
      ),
      pool.query(
        `SELECT ml.aircraft_id, ac.model, ac.manufacturer, ac.status AS aircraft_status,
                COUNT(*)        AS maintenance_count,
                MAX(ml.date)    AS last_maintenance_date,
                COUNT(CASE WHEN ml.maintenance_type = 'Emergency' THEN 1 END) AS emergency_count
         FROM maintenance_log ml
         JOIN aircraft ac ON ac.aircraft_id = ml.aircraft_id
         ${where}
         GROUP BY ml.aircraft_id, ac.model, ac.manufacturer, ac.status
         ORDER BY maintenance_count DESC
         LIMIT 10`,
        params
      ),
      pool.query(
        `SELECT ${LOG_COLS} ${LOG_FROM}
         ${alertWhere}
         ORDER BY ml.date DESC LIMIT 15`,
        params
      ),
    ]);

    return ApiResponse.success(res, {
      overall:          overallRes.rows[0],
      by_type:          byTypeRes.rows,
      by_aircraft:      byAircraftRes.rows,
      recent_critical:  criticalRes.rows,
    });
  } catch (err) { next(err); }
};

// ─── Aircraft maintenance history — before /:id ───────────────────────────────
const getByAircraft = async (req, res, next) => {
  try {
    const { aircraftId }          = req.params;
    const { type, from_date, to_date } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = ['ml.aircraft_id = $1'];
    const params = [aircraftId];
    let   idx    = 2;

    if (type)      { conds.push(`ml.maintenance_type = $${idx}`);           params.push(type);      idx++; }
    if (from_date) { conds.push(`ml.date >= $${idx}::date`);                params.push(from_date); idx++; }
    if (to_date)   { conds.push(`ml.date <= $${idx}::date`);                params.push(to_date);   idx++; }

    const where = `WHERE ${conds.join(' AND ')}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${LOG_FROM} ${where}`, params),
      pool.query(
        `SELECT ${LOG_COLS} ${LOG_FROM} ${where}
         ORDER BY ml.date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return ApiResponse.paginated(
      res, dataRes.rows, paginationMeta(parseInt(countRes.rows[0].count), page, limit)
    );
  } catch (err) { next(err); }
};

// ─── List all (admin, filterable) ─────────────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { aircraft_id, emp_id, type, from_date, to_date,
            sort_by = 'date', order = 'desc' } = req.query;
    const { page, limit, offset }              = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (aircraft_id) { conds.push(`ml.aircraft_id = $${idx}`);              params.push(aircraft_id); idx++; }
    if (emp_id)      { conds.push(`ml.emp_id       = $${idx}`);             params.push(emp_id);      idx++; }
    if (type)        { conds.push(`ml.maintenance_type = $${idx}`);         params.push(type);        idx++; }
    if (from_date)   { conds.push(`ml.date >= $${idx}::date`);              params.push(from_date);   idx++; }
    if (to_date)     { conds.push(`ml.date <= $${idx}::date`);              params.push(to_date);     idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? `ml.${sort_by}` : 'ml.date';
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
      `SELECT ${LOG_COLS} ${LOG_FROM} WHERE ml.s_no = $1`, [req.params.id]
    );
    if (!rows.length) return next(AppError.notFound('Maintenance record not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

// ─── Create ────────────────────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { date, title, remark, emp_id, aircraft_id,
            maintenance_type = 'Scheduled' } = req.body;

    // 1. Aircraft must exist and not be Retired (Lab 07 composition constraint)
    const { rows: [ac] } = await pool.query(
      'SELECT status FROM aircraft WHERE aircraft_id = $1', [aircraft_id]
    );
    if (!ac) return next(AppError.notFound('Aircraft not found'));
    if (ac.status === 'Retired') {
      return next(AppError.badRequest(
        'Cannot log maintenance for a Retired aircraft — operational logs are retained but new entries are blocked'
      ));
    }

    // 2. Responsible staff must be an active Maintenance employee (UC-17)
    try { await assertMaintenanceStaff(emp_id); }
    catch (err) { return next(err); }

    const { rows: [record] } = await pool.query(
      `INSERT INTO maintenance_log (date, title, remark, emp_id, aircraft_id, maintenance_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [date, title, remark ?? null, emp_id, aircraft_id, maintenance_type]
    );

    return ApiResponse.created(res, record);
  } catch (err) { next(err); }
};

// ─── Update ────────────────────────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { id }    = req.params;
    const { date, title, remark, maintenance_type, emp_id } = req.body;

    // Validate new staff if changing responsible employee
    if (emp_id) {
      try { await assertMaintenanceStaff(emp_id); }
      catch (err) { return next(err); }
    }

    const { rows: [record] } = await pool.query(
      `UPDATE maintenance_log
       SET date             = COALESCE($1::date, date),
           title            = COALESCE($2, title),
           remark           = COALESCE($3, remark),
           maintenance_type = COALESCE($4::maintenance_type, maintenance_type),
           emp_id           = COALESCE($5, emp_id),
           updated_at       = NOW()
       WHERE s_no = $6 RETURNING *`,
      [date ?? null, title ?? null, remark ?? null, maintenance_type ?? null, emp_id ?? null, id]
    );
    if (!record) return next(AppError.notFound('Maintenance record not found'));
    return ApiResponse.success(res, record);
  } catch (err) { next(err); }
};

module.exports = { summary, getByAircraft, list, getById, create, update };
