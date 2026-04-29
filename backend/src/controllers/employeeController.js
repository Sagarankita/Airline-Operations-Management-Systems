const pool        = require('../config/db');
const AppError    = require('../utils/AppError');
const ApiResponse = require('../utils/ApiResponse');
const { parsePagination, paginationMeta } = require('../utils/paginate');

const VALID_SORT     = new Set(['emp_id', 'name', 'role', 'status', 'doj', 'created_at']);
const SUBTYPE_TABLES = { Pilot: 'pilot', Cabin_Crew: 'cabin_crew', Ground_Staff: 'ground_staff' };

// ─── Internal helpers ────────────────────────────────────────────────────────

const getSubtype = async (db, empId, role) => {
  const table = SUBTYPE_TABLES[role];
  if (!table) return null;
  const { rows } = await db.query(`SELECT * FROM ${table} WHERE emp_id = $1`, [empId]);
  return rows[0] || null;
};

const assertBaseAirportExists = async (client, code) => {
  if (!code) return;
  const { rows } = await client.query(
    'SELECT 1 FROM airport WHERE airport_code = $1', [code]
  );
  if (!rows.length) throw AppError.badRequest(`Base airport code '${code}' does not exist`);
};

const insertSubtype = async (client, empId, role, data = {}) => {
  if (role === 'Pilot') {
    const {
      passport_no, license_number,
      fitness = 'Fit', total_flight_hours = 0, rank = 'Cadet', base_airport = null,
    } = data;
    await client.query(
      `INSERT INTO pilot
         (emp_id, passport_no, license_number, fitness, total_flight_hours, rank, base_airport)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [empId, passport_no, license_number, fitness, total_flight_hours, rank, base_airport]
    );
  } else if (role === 'Cabin_Crew') {
    const { passport_no, fitness = 'Fit', base_airport = null, total_exp_years = 0 } = data;
    await client.query(
      `INSERT INTO cabin_crew (emp_id, passport_no, fitness, base_airport, total_exp_years)
       VALUES ($1,$2,$3,$4,$5)`,
      [empId, passport_no, fitness, base_airport, total_exp_years]
    );
  } else if (role === 'Ground_Staff') {
    const { department, shift_time } = data;
    await client.query(
      `INSERT INTO ground_staff (emp_id, department, shift_time) VALUES ($1,$2,$3)`,
      [empId, department, shift_time]
    );
  }
};

const upsertSubtype = async (client, empId, role, data = {}) => {
  if (role === 'Pilot') {
    const { passport_no, license_number, fitness, total_flight_hours, rank, base_airport } = data;
    await client.query(
      `INSERT INTO pilot
         (emp_id, passport_no, license_number, fitness, total_flight_hours, rank, base_airport)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (emp_id) DO UPDATE SET
         passport_no        = COALESCE(EXCLUDED.passport_no,        pilot.passport_no),
         license_number     = COALESCE(EXCLUDED.license_number,     pilot.license_number),
         fitness            = COALESCE(EXCLUDED.fitness,            pilot.fitness),
         total_flight_hours = COALESCE(EXCLUDED.total_flight_hours, pilot.total_flight_hours),
         rank               = COALESCE(EXCLUDED.rank,               pilot.rank),
         base_airport       = COALESCE(EXCLUDED.base_airport,       pilot.base_airport)`,
      [
        empId,
        passport_no        ?? null,
        license_number     ?? null,
        fitness            ?? null,
        total_flight_hours ?? null,
        rank               ?? null,
        base_airport       ?? null,
      ]
    );
  } else if (role === 'Cabin_Crew') {
    const { passport_no, fitness, base_airport, total_exp_years } = data;
    await client.query(
      `INSERT INTO cabin_crew (emp_id, passport_no, fitness, base_airport, total_exp_years)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (emp_id) DO UPDATE SET
         passport_no     = COALESCE(EXCLUDED.passport_no,     cabin_crew.passport_no),
         fitness         = COALESCE(EXCLUDED.fitness,         cabin_crew.fitness),
         base_airport    = COALESCE(EXCLUDED.base_airport,    cabin_crew.base_airport),
         total_exp_years = COALESCE(EXCLUDED.total_exp_years, cabin_crew.total_exp_years)`,
      [empId, passport_no ?? null, fitness ?? null, base_airport ?? null, total_exp_years ?? null]
    );
  } else if (role === 'Ground_Staff') {
    const { department, shift_time } = data;
    await client.query(
      `INSERT INTO ground_staff (emp_id, department, shift_time)
       VALUES ($1,$2,$3)
       ON CONFLICT (emp_id) DO UPDATE SET
         department = COALESCE(EXCLUDED.department, ground_staff.department),
         shift_time = COALESCE(EXCLUDED.shift_time, ground_staff.shift_time)`,
      [empId, department ?? null, shift_time ?? null]
    );
  }
};

// ─── Department label derived from role (for admin list view) ────────────────
const DEPT_CASE = `
  CASE e.role
    WHEN 'Pilot'        THEN 'Flight Operations'
    WHEN 'Cabin_Crew'   THEN 'In-Flight Services'
    WHEN 'Maintenance'  THEN 'Maintenance'
    WHEN 'Fuel_Staff'   THEN 'Ground Operations'
    WHEN 'Admin'        THEN 'Administration'
    ELSE NULL
  END`;

// ─── Controllers ─────────────────────────────────────────────────────────────

const list = async (req, res, next) => {
  try {
    const { search, role, status, base_airport, sort_by = 'emp_id', order = 'asc' } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const conds  = [];
    const params = [];
    let   idx    = 1;

    if (search) {
      conds.push(`(e.name ILIKE $${idx} OR e.contact ILIKE $${idx} OR CAST(e.emp_id AS TEXT) ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (role)   { conds.push(`e.role = $${idx}`);   params.push(role);   idx++; }
    if (status) { conds.push(`e.status = $${idx}`); params.push(status); idx++; }
    if (base_airport) {
      conds.push(`(p.base_airport = $${idx} OR cc.base_airport = $${idx})`);
      params.push(base_airport.toUpperCase());
      idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const col   = VALID_SORT.has(sort_by) ? `e.${sort_by}` : 'e.emp_id';
    const dir   = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const FROM = `
      FROM employee e
      LEFT JOIN pilot        p  ON p.emp_id  = e.emp_id AND e.role = 'Pilot'
      LEFT JOIN cabin_crew   cc ON cc.emp_id = e.emp_id AND e.role = 'Cabin_Crew'
      LEFT JOIN ground_staff gs ON gs.emp_id = e.emp_id AND e.role = 'Ground_Staff'
      ${where}`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) ${FROM}`, params),
      pool.query(
        `SELECT
           e.emp_id, e.name, e.gender, e.dob, e.doj, e.role,
           e.contact, e.status, e.created_at, e.updated_at,
           COALESCE(p.base_airport, cc.base_airport)   AS base_airport,
           COALESCE(gs.department, ${DEPT_CASE})       AS department,
           p.rank                 AS pilot_rank,
           p.total_flight_hours,
           p.fitness              AS pilot_fitness,
           cc.total_exp_years,
           cc.fitness             AS crew_fitness,
           gs.shift_time
         ${FROM}
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

const getById = async (req, res, next) => {
  try {
    const { id }    = req.params;
    const { rows }  = await pool.query('SELECT * FROM employee WHERE emp_id = $1', [id]);
    if (!rows.length) return next(AppError.notFound('Employee not found'));
    const emp     = rows[0];
    const details = await getSubtype(pool, id, emp.role);
    return ApiResponse.success(res, { ...emp, details });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, gender, dob, doj, role, contact } = req.body;
    const subtypeData = req.body[role.toLowerCase()] || {};

    await assertBaseAirportExists(client, subtypeData.base_airport);

    const empRes = await client.query(
      `INSERT INTO employee (name, gender, dob, doj, role, contact)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, gender, dob, doj, role, contact]
    );
    const emp = empRes.rows[0];

    if (SUBTYPE_TABLES[role]) {
      await insertSubtype(client, emp.emp_id, role, subtypeData);
    }

    await client.query('COMMIT');
    const details = await getSubtype(pool, emp.emp_id, role);
    return ApiResponse.created(res, { ...emp, details });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const update = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id }                              = req.params;
    const { name, gender, dob, doj, contact, status } = req.body;

    const empRes = await client.query(
      `UPDATE employee
       SET name       = COALESCE($1, name),
           gender     = COALESCE($2::gender_type,     gender),
           dob        = COALESCE($3::date,             dob),
           doj        = COALESCE($4::date,             doj),
           contact    = COALESCE($5,                   contact),
           status     = COALESCE($6::employee_status,  status),
           updated_at = NOW()
       WHERE emp_id = $7 RETURNING *`,
      [name ?? null, gender ?? null, dob ?? null, doj ?? null, contact ?? null, status ?? null, id]
    );
    if (!empRes.rows.length) {
      await client.query('ROLLBACK');
      return next(AppError.notFound('Employee not found'));
    }

    const emp         = empRes.rows[0];
    const subtypeData = req.body[emp.role.toLowerCase()];

    if (subtypeData && SUBTYPE_TABLES[emp.role]) {
      await assertBaseAirportExists(client, subtypeData.base_airport);
      await upsertSubtype(client, id, emp.role, subtypeData);
    }

    await client.query('COMMIT');
    const details = await getSubtype(pool, id, emp.role);
    return ApiResponse.success(res, { ...emp, details });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (status === 'Terminated' || status === 'Inactive') {
      const { rows: conflicts } = await pool.query(
        `SELECT 1 FROM crew_assignment ca
         JOIN flight f ON f.flight_id = ca.flight_id
         WHERE ca.emp_id = $1 AND f.departure_time > NOW()
         LIMIT 1`,
        [id]
      );
      if (conflicts.length) {
        return next(AppError.conflict(
          'Cannot deactivate employee with upcoming flight assignments — reassign first'
        ));
      }
    }

    const { rows } = await pool.query(
      `UPDATE employee SET status = $1, updated_at = NOW()
       WHERE emp_id = $2 RETURNING *`,
      [status, id]
    );
    if (!rows.length) return next(AppError.notFound('Employee not found'));
    return ApiResponse.success(res, rows[0]);
  } catch (err) { next(err); }
};

module.exports = { list, getById, create, update, updateStatus };
