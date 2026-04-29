const { Pool } = require('pg');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, NODE_ENV } = require('./env');

const pool = new Pool({
  host:     DB_HOST,
  port:     Number(DB_PORT),
  database: DB_NAME,
  user:     DB_USER,
  password: DB_PASSWORD,
  ssl:      NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max:                  20,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

module.exports = pool;
