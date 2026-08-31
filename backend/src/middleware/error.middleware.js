const { ZodError } = require('zod');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');
const multer = require('multer');
const { error } = require('../utils/apiResponse');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return error(res, 'Validation error', 400, formattedErrors);
  }

  if (err instanceof TokenExpiredError) {
    return error(res, 'Token expired', 401);
  }

  if (err instanceof JsonWebTokenError) {
    return error(res, 'Invalid token', 401);
  }

  if (err instanceof multer.MulterError) {
    return error(res, `File upload error: ${err.message}`, 400);
  }

  if (err.statusCode) {
    return error(res, err.message, err.statusCode, err.errors);
  }

  return error(res, 'Internal Server Error', 500);
};

module.exports = errorHandler;
