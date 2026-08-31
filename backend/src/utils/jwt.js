const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const generateAccessToken = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
    jwtid: jti,
  });
  return { token, jti };
};

const generateRefreshToken = (payload) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
    jwtid: jti,
  });
  return { token, jti };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
