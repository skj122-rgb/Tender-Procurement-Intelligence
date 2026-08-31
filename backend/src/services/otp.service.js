const crypto = require('crypto');
const db = require('../config/database');

/**
 * Hash OTP using SHA-256
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp.toString()).digest('hex');
};

/**
 * Generate and store a new OTP for a user
 */
const createOtp = async (userId, purpose) => {
  // Invalidate any previous OTP for same user+purpose
  await db.query(
    `UPDATE otp_verifications 
     SET max_attempts = attempts 
     WHERE user_id = $1 AND purpose = $2 AND verified_at IS NULL AND expires_at > NOW()`,
    [userId, purpose]
  );

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(otp);
  const maxAttempts = 3;

  await db.query(
    `INSERT INTO otp_verifications (user_id, otp_hash, purpose, attempts, max_attempts, expires_at)
     VALUES ($1, $2, $3, 0, $4, NOW() + INTERVAL '5 minutes')`,
    [userId, otpHash, purpose, maxAttempts]
  );

  return otp;
};

/**
 * Verify an OTP
 */
const verifyOtp = async (userId, purpose, candidateOtp) => {
  const result = await db.query(
    `SELECT id, otp_hash, attempts, max_attempts 
     FROM otp_verifications 
     WHERE user_id = $1 AND purpose = $2 AND verified_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, purpose]
  );

  if (result.rows.length === 0) {
    return { valid: false, message: 'No valid OTP found or OTP expired', attemptsLeft: 0 };
  }

  const otpRecord = result.rows[0];

  if (otpRecord.attempts >= otpRecord.max_attempts) {
    return { valid: false, message: 'Maximum verification attempts reached', attemptsLeft: 0 };
  }

  const candidateHash = hashOtp(candidateOtp);
  
  // Use timingSafeEqual to compare hashes securely
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(otpRecord.otp_hash, 'hex'),
    Buffer.from(candidateHash, 'hex')
  );

  if (isMatch) {
    await db.query(
      `UPDATE otp_verifications SET verified_at = NOW() WHERE id = $1`,
      [otpRecord.id]
    );
    return { valid: true };
  } else {
    const newAttempts = otpRecord.attempts + 1;
    await db.query(
      `UPDATE otp_verifications SET attempts = $1 WHERE id = $2`,
      [newAttempts, otpRecord.id]
    );
    return { 
      valid: false, 
      message: 'Invalid OTP', 
      attemptsLeft: otpRecord.max_attempts - newAttempts 
    };
  }
};

module.exports = {
  createOtp,
  verifyOtp
};
