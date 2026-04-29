const { NODE_ENV } = require('../config/env');

const PG_ERRORS = {
  '23505': { code: 409, msg: 'Duplicate entry — a record with these details already exists' },
  '23503': { code: 400, msg: 'Referenced record does not exist' },
  '23514': { code: 400, msg: 'Value violates a check constraint' },
  '22P02': { code: 400, msg: 'Invalid input format' },
  '42P01': { code: 500, msg: 'Undefined table — check your schema migration' },
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message   || 'Internal Server Error';
  let errors     = err.errors    || [];

  if (err.code && PG_ERRORS[err.code]) {
    statusCode = PG_ERRORS[err.code].code;
    message    = PG_ERRORS[err.code].msg;
  } else if (!err.isOperational) {
    statusCode = 500;
    message    = 'Internal Server Error';
  }

  const payload = {
    success: false,
    message,
    ...(errors.length && { errors }),
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  };

  return res.status(statusCode).json(payload);
};

module.exports = errorHandler;
