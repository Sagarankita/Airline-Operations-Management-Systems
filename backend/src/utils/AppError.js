class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode   = statusCode;
    this.isOperational = true;
    this.errors       = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new AppError(message, 400, errors);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static forbidden(message = 'Access denied') {
    return new AppError(message, 403);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
