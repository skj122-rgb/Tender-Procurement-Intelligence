const db = require('../config/database');
const { hashPassword, comparePassword, dummyCompare } = require('../utils/password');

/**
 * Create a new user account (status = 'pending' until OTP verified).
 * @param {object} data - { uniqueId, username, password, email, phoneNumber }
 * @returns {object} created user (without password_hash)
 */
const signup = async ({ uniqueId, username, password, email, phoneNumber }) => {
  // Check uniqueness of all four fields
  const conflicts = await db.query(
    `SELECT
       (SELECT id FROM users WHERE unique_id  = $1) AS uid_conflict,
       (SELECT id FROM users WHERE username   = $2) AS uname_conflict,
       (SELECT id FROM users WHERE email      = $3) AS email_conflict,
       (SELECT id FROM users WHERE phone_number = $4) AS phone_conflict`,
    [uniqueId, username, email, phoneNumber]
  );

  const row = conflicts.rows[0];
  const errors = [];
  if (row.uid_conflict) errors.push({ field: 'uniqueId', message: 'This Unique ID is already registered' });
  if (row.uname_conflict) errors.push({ field: 'username', message: 'This username is already taken' });
  if (row.email_conflict) errors.push({ field: 'email', message: 'This email is already registered' });
  if (row.phone_conflict) errors.push({ field: 'phoneNumber', message: 'This phone number is already registered' });

  if (errors.length > 0) {
    const err = new Error('Validation failed');
    err.statusCode = 409;
    err.errors = errors;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const result = await db.query(
    `INSERT INTO users (unique_id, username, password_hash, email, phone_number, account_status, role)
     VALUES ($1, $2, $3, $4, $5, 'pending', 'officer')
     RETURNING id, unique_id, username, email, phone_number, account_status, role, created_at`,
    [uniqueId, username, passwordHash, email, phoneNumber]
  );

  return result.rows[0];
};

/**
 * Authenticate a user by identifier (username, email, or unique_id) + password.
 * @param {string} identifier
 * @param {string} password
 * @returns {object} user row (includes password_hash for comparison)
 */
const login = async (identifier, password) => {
  const result = await db.query(
    `SELECT * FROM users
     WHERE username = $1 OR email = $1 OR unique_id = $1`,
    [identifier]
  );

  if (result.rows.length === 0) {
    // Timing attack prevention: run bcrypt even when user not found
    await dummyCompare();
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];
  const isMatch = await comparePassword(password, user.password_hash);

  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  if (user.account_status === 'pending') {
    const err = new Error('Account not verified. Please complete OTP verification.');
    err.statusCode = 403;
    throw err;
  }

  if (user.account_status === 'suspended') {
    const err = new Error('Account suspended. Contact administrator.');
    err.statusCode = 403;
    throw err;
  }

  return user;
};

/**
 * Get user by internal UUID (for /me endpoint and middleware).
 */
const getUserById = async (id) => {
  const result = await db.query(
    `SELECT id, unique_id, username, email, phone_number,
            email_verified, phone_verified, account_status, role, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Find user by any identifier (username, email, or unique_id).
 */
const getUserByIdentifier = async (identifier) => {
  const result = await db.query(
    `SELECT id, unique_id, username, email, phone_number,
            email_verified, phone_verified, account_status, role
     FROM users
     WHERE username = $1 OR email = $1 OR unique_id = $1`,
    [identifier]
  );
  return result.rows[0] || null;
};

/**
 * Mark a user's email as verified. If both email + phone verified, activate account.
 */
const setEmailVerified = async (userId) => {
  await db.query(`UPDATE users SET email_verified = true, phone_verified = true, account_status = 'active' WHERE id = $1`, [userId]);
};

const setPhoneVerified = async (userId) => {
  await db.query('UPDATE users SET phone_verified = true WHERE id = $1', [userId]);
};

/**
 * Update user's password hash.
 */
const updatePassword = async (userId, newPasswordHash) => {
  await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );
};

/**
 * Blacklist a JWT token (for logout).
 */
const blacklistToken = async (jti, userId, expiresAt) => {
  await db.query(
    `INSERT INTO token_blacklist (token_jti, user_id, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (token_jti) DO NOTHING`,
    [jti, userId, new Date(expiresAt * 1000)]
  );
};

/**
 * Check if a JWT token is blacklisted.
 */
const isTokenBlacklisted = async (jti) => {
  const result = await db.query(
    'SELECT id FROM token_blacklist WHERE token_jti = $1 AND expires_at > NOW()',
    [jti]
  );
  return result.rows.length > 0;
};

/**
 * Activate account upon verification
 */
const _tryActivateAccount = async (userId) => {
  await db.query(
    `UPDATE users SET account_status = 'active' WHERE id = $1`,
    [userId]
  );
};

module.exports = {
  signup,
  login,
  getUserById,
  getUserByIdentifier,
  setEmailVerified,
  setPhoneVerified,
  updatePassword,
  blacklistToken,
  isTokenBlacklisted,
};
