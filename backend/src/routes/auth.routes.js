const express = require('express');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter.middleware');
const validate = require('../middleware/validate.middleware');
// Assuming schemas and controllers exist in these paths
const { 
  signupSchema, verifyOtpSchema, resendOtpSchema, loginSchema, forgotPasswordSchema, verifyResetOtpSchema, resetPasswordSchema 
} = require('../validators/auth.validator');
const auth = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/signup', authLimiter, validate({ body: signupSchema }), auth.signup);
router.post('/verify-email-otp', otpLimiter, validate({ body: verifyOtpSchema }), auth.verifyEmailOtp);
router.post('/resend-email-otp', otpLimiter, validate({ body: resendOtpSchema }), auth.resendEmailOtp);
router.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
router.post('/logout', authenticate, auth.logout);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), auth.forgotPassword);
router.post('/verify-reset-otp', otpLimiter, validate({ body: verifyResetOtpSchema }), auth.verifyResetOtp);
router.post('/reset-password', validate({ body: resetPasswordSchema }), auth.resetPassword);
router.get('/me', authenticate, auth.getMe);

module.exports = router;
