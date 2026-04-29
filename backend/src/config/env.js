require('dotenv').config();

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  NODE_ENV:    process.env.NODE_ENV    || 'development',
  PORT:        process.env.PORT        || 5000,
  DB_HOST:     process.env.DB_HOST,
  DB_PORT:     process.env.DB_PORT,
  DB_NAME:     process.env.DB_NAME,
  DB_USER:     process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
