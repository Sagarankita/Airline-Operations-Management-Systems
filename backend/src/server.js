const app  = require('./app');
const pool = require('./config/db');
const { PORT } = require('./config/env');

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] PostgreSQL connected successfully');
    app.listen(PORT, () => {
      console.log(`[Server] Running  → http://localhost:${PORT}`);
      console.log(`[Docs]   Swagger  → http://localhost:${PORT}/api-docs`);
      console.log(`[Health] Check    → http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
};

start();
