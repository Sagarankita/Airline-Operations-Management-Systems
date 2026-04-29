const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validate = (rules) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      }));
      return next(AppError.badRequest('Validation failed', errors));
    }
    next();
  },
];

module.exports = validate;
