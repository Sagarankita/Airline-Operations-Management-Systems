require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const run = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL       PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) {
        console.log(`[Migrate] Skipped (already applied): ${file}`);
        continue;
      }

      const raw    = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const noTxn  = raw.trimStart().startsWith('-- no-transaction');
      const sql    = noTxn ? raw.replace(/^--\s*no-transaction[^\n]*\n?/m, '').trim() : raw;

      if (noTxn) {
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
          console.log(`[Migrate] Applied (no-txn): ${file}`);
        } catch (err) {
          throw new Error(`Migration failed [${file}]: ${err.message}`);
        }
      } else {
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`[Migrate] Applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw new Error(`Migration failed [${file}]: ${err.message}`);
        }
      }
    }

    console.log('[Migrate] All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error('[Migrate] Fatal:', err.message);
  process.exit(1);
});
