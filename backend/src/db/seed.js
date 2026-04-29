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

const SEEDS_DIR = path.join(__dirname, 'seeds');

const run = async () => {
  const client = await pool.connect();
  try {
    const files = fs
      .readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf8');
      await client.query(sql);
      console.log(`[Seed] Applied: ${file}`);
    }

    console.log('[Seed] All seeds complete.');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err) => {
  console.error('[Seed] Fatal:', err.message);
  process.exit(1);
});
