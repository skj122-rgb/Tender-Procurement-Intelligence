const env = require('../config/env');
const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const { success, error } = require('../utils/apiResponse');
const jwt = require('../utils/jwt');
const { hashPassword } = require('../utils/password');
const { OTP_PURPOSES } = require('../utils/constants');

/**
 * POST /api/auth/signup
 * Register a new user account, send email + phone OTPs.
 */
const signup = async (req, res, next) => {
  try {
    const { uniqueId, username, password, email, phoneNumber } = req.body;

    // Create user (pending status)
    const user = await authService.signup({ uniqueId, username, password, email, phoneNumber });

    // Generate and send email OTP
    const emailOtp = await otpService.createOtp(user.id, OTP_PURPOSES.SIGNUP_EMAIL);
    await emailService.sendOtpEmail(email, emailOtp);

    return success(res, {
      userId: user.id,
      message: 'Account created. Please verify your email address.',
      emailOtp: !env.SMTP_USER ? emailOtp : undefined,
    }, 'Signup successful', 201);
  } catch (err) {
    if (err.statusCode === 409) {
      return error(res, err.message, 409, err.errors);
    }
    next(err);
  }
};

/**
 * POST /api/auth/verify-email-otp
 */
const verifyEmailOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const result = await otpService.verifyOtp(userId, OTP_PURPOSES.SIGNUP_EMAIL, otp);
    if (!result.valid) {
      return error(res, result.message, 400, { attemptsLeft: result.attemptsLeft });
    }

    await authService.setEmailVerified(userId);

    // Check if account is now fully activated
    const user = await authService.getUserById(userId);
    const isActive = user && user.account_status === 'active';

    return success(res, {
      emailVerified: true,
      accountActive: isActive,
    }, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend-email-otp
 */
const resendEmailOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await authService.getUserById(userId);
    if (!user || user.email_verified) {
      return success(res, null, 'If applicable, a new OTP has been sent');
    }

    const otp = await otpService.createOtp(userId, OTP_PURPOSES.SIGNUP_EMAIL);
    await emailService.sendOtpEmail(user.email, otp);

    return success(res, null, 'OTP resent to your email');
  } catch (err) {
    if (err.message && err.message.includes('cooldown')) {
      return error(res, err.message, 429);
    }
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const user = await authService.login(identifier, password);

    const tokenPayload = {
      userId: user.id,
      uniqueId: user.unique_id,
      username: user.username,
      role: user.role,
    };

    const { token: accessToken } = jwt.generateAccessToken(tokenPayload);

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        uniqueId: user.unique_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }, 'Login successful');
  } catch (err) {
    if (err.statusCode === 401) {
      return error(res, 'Invalid credentials', 401);
    }
    if (err.statusCode === 403) {
      return error(res, err.message, 403);
    }
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verifyAccessToken(token);
        if (decoded && decoded.jti) {
          await authService.blacklistToken(decoded.jti, decoded.userId, decoded.exp);
        }
      } catch (_) {
        // Token already expired or invalid — logout is still successful
      }
    }

    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 * Always returns generic message regardless of whether account exists.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const user = await authService.getUserByIdentifier(identifier);

    if (user && user.account_status === 'active') {
      // Send email reset OTP
      const emailOtp = await otpService.createOtp(user.id, OTP_PURPOSES.PASSWORD_RESET_EMAIL);
      await emailService.sendPasswordResetEmail(user.email, emailOtp);
    }

    // Always return same message — don't reveal if account exists
    return success(res, null, 'If an account exists with that identifier, a verification code has been sent to the registered email.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-reset-otp
 * Verify email OTP for password reset.
 */
const verifyResetOtp = async (req, res, next) => {
  try {
    const { identifier, emailOtp, otp } = req.body;
    const code = emailOtp || otp;

    const user = await authService.getUserByIdentifier(identifier);
    if (!user) {
      return error(res, 'Invalid verification request', 400);
    }

    // Verify email OTP
    const emailResult = await otpService.verifyOtp(user.id, OTP_PURPOSES.PASSWORD_RESET_EMAIL, code);
    if (!emailResult.valid) {
      return error(res, emailResult.message || 'Invalid or expired email verification code', 400);
    }

    // Generate a short-lived reset token
    const { token: resetToken } = jwt.generateAccessToken({ userId: user.id, purpose: 'password_reset' });

    return success(res, { resetToken }, 'Email verification successful. You can now reset your password.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, identifier, emailOtp, otp, newPassword, confirmPassword } = req.body;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return error(res, 'Passwords do not match', 400);
    }

    let targetUserId = null;

    if (resetToken) {
      try {
        const decoded = jwt.verifyAccessToken(resetToken);
        if (decoded && decoded.purpose === 'password_reset') {
          targetUserId = decoded.userId;
        }
      } catch (_) {}
    }

    if (!targetUserId && identifier && (emailOtp || otp)) {
      const user = await authService.getUserByIdentifier(identifier);
      if (user) {
        const emailResult = await otpService.verifyOtp(user.id, OTP_PURPOSES.PASSWORD_RESET_EMAIL, emailOtp || otp);
        if (emailResult.valid) {
          targetUserId = user.id;
        }
      }
    }

    if (!targetUserId) {
      return error(res, 'Invalid or expired verification session. Please request a new code.', 400);
    }

    const newHash = await hashPassword(newPassword);
    await authService.updatePassword(targetUserId, newHash);

    return success(res, null, 'Password updated successfully. Please login with your new password.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return error(res, 'User not found', 404);
    }
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  logout,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getMe,
};
