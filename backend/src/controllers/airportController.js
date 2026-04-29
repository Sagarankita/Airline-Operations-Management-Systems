const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

const list = async (req, res, next) => {
  try {
    const { search } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const params = [];
    let idx = 1;
    let where = '';

    if (search) {
      where = `WHERE airport_code ILIKE $${idx}
               OR name           ILIKE $${idx}
               OR city           ILIKE $${idx}
               OR country        ILIKE $${idx}`;
      params.push(`%${search}%`);
      idx++;
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM airport ${where}`, params);
    const total    = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT * FROM airport ${where}
       ORDER BY airport_code
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return ApiResponse.paginated(res, dataRes.rows, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

const getByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM airport WHERE airport_code = $1',
      [code.toUpperCase()]
    );
    if (!rows.length) return next(AppError.notFound('Airport not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { airport_code, name, city, country } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO airport (airport_code, name, city, country)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [airport_code.toUpperCase(), name, city, country]
    );
    return ApiResponse.created(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, city, country } = req.body;
    const { rows } = await pool.query(
      `UPDATE airport
       SET name = $1, city = $2, country = $3, updated_at = NOW()
       WHERE airport_code = $4
       RETURNING *`,
      [name, city, country, code.toUpperCase()]
    );
    if (!rows.length) return next(AppError.notFound('Airport not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { code } = req.params;
    const refs = await pool.query(
      `SELECT 1 FROM flight
       WHERE source_airport_code = $1 OR dest_airport_code = $1
       UNION ALL
       SELECT 1 FROM pilot        WHERE base_airport = $1
       UNION ALL
       SELECT 1 FROM cabin_crew   WHERE base_airport = $1
       LIMIT 1`,
      [code.toUpperCase()]
    );
    if (refs.rows.length) {
      return next(
        AppError.conflict(
          'Airport is referenced by flights or employee records and cannot be deleted'
        )
      );
    }
    const { rows } = await pool.query(
      'DELETE FROM airport WHERE airport_code = $1 RETURNING *',
      [code.toUpperCase()]
    );
    if (!rows.length) return next(AppError.notFound('Airport not found'));
    return ApiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getByCode, create, update, remove };
