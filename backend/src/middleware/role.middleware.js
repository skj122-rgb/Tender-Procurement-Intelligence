const { error } = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return error(res, 'Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: Insufficient permissions', 403);
    }

    next();
  };
};

module.exports = authorize;
