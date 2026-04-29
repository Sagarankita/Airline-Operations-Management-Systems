const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

const VALID_SORT = new Set([
  'aircraft_id', 'model', 'manufacturer', 'weight_capacity', 'range_km', 'status', 'created_at',
]);

const list = async (req, res, next) => {
  try {
    const { search, status, manufacturer, sort_by = 'aircraft_id', order = 'asc' } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (search) {
      conds.push(`(model ILIKE $${idx} OR manufacturer ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (status) {
      conds.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }
    if (manufacturer) {
      conds.push(`manufacturer ILIKE $${idx}`);
      params.push(`%${manufacturer}%`);
      idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? sort_by : 'aircraft_id';
    const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM aircraft ${where}`, params),
      pool.query(
        `SELECT * FROM aircraft ${where} ORDER BY ${col} ${dir} LIMIT $${idx} OFFSET $${idx + 1}`,
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
      'SELECT * FROM aircraft WHERE aircraft_id = $1', [req.params.id]
    );
    if (!rows.length) return next(AppError.notFound('Aircraft not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { model, manufacturer, weight_capacity, range_km, status = 'Active' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO aircraft (model, manufacturer, weight_capacity, range_km, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [model, manufacturer, weight_capacity, range_km, status]
    );
    return ApiResponse.created(res, rows[0]);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id }                                       = req.params;
    const { model, manufacturer, weight_capacity, range_km } = req.body;
    const { rows } = await pool.query(
      `UPDATE aircraft
       SET model           = COALESCE($1, model),
           manufacturer    = COALESCE($2, manufacturer),
           weight_capacity = COALESCE($3, weight_capacity),
           range_km        = COALESCE($4, range_km),
           updated_at      = NOW()
       WHERE aircraft_id = $5 RETURNING *`,
      [model ?? null, manufacturer ?? null, weight_capacity ?? null, range_km ?? null, id]
    );
    if (!rows.length) return next(AppError.notFound('Aircraft not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (status === 'Retired') {
      const { rows: active } = await pool.query(
        `SELECT 1 FROM flight
         WHERE aircraft_id = $1 AND arrival_time > NOW() LIMIT 1`,
        [id]
      );
      if (active.length) {
        return next(AppError.conflict(
          'Cannot retire aircraft assigned to upcoming flights — reassign those flights first'
        ));
      }
    }

    const { rows } = await pool.query(
      `UPDATE aircraft SET status = $1, updated_at = NOW()
       WHERE aircraft_id = $2 RETURNING *`,
      [status, id]
    );
    if (!rows.length) return next(AppError.notFound('Aircraft not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, updateStatus };
