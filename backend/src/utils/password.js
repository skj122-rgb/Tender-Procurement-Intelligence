const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (candidate, hash) => {
  return await bcrypt.compare(candidate, hash);
};

const dummyCompare = async () => {
  // Compare against a dummy hash to prevent timing attacks
  const dummyHash = '$2b$12$Kix3hQ5tU6zS8Q5tU6zS8O5tU6zS8Q5tU6zS8Q5tU6zS8Q5tU6zS8';
  return await bcrypt.compare('dummy', dummyHash);
};

module.exports = {
  hashPassword,
  comparePassword,
  dummyCompare,
};
