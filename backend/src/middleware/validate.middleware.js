const { ZodError } = require('zod');
const { error } = require('../utils/apiResponse');

const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query);
    }
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params);
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const formattedErrors = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return error(res, 'Validation error', 400, formattedErrors);
    }
    next(err);
  }
};

module.exports = validate;
