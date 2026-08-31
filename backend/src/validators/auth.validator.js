const { z } = require('zod');

const signupSchema = z.object({
  uniqueId: z.string().optional().default(() => `UID-${Math.floor(1000 + Math.random() * 9000)}`),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phoneNumber: z.string().transform(v => v.replace(/[\s\-\(\)]/g, '')).pipe(
    z.string().regex(/^(\+?\d{10,15})$/, 'Phone number must contain 10-15 digits')
  ),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username, email, or unique ID is required'),
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  userId: z.string().min(1, 'Invalid user ID'),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

const resendOtpSchema = z.object({
  userId: z.string().min(1, 'Invalid user ID'),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Username, email, or unique ID is required'),
});

const verifyResetOtpSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  emailOtp: z.string().length(6).regex(/^\d{6}$/, 'Verification code must be exactly 6 digits').optional(),
  otp: z.string().length(6).regex(/^\d{6}$/, 'Verification code must be exactly 6 digits').optional(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().optional(),
  identifier: z.string().optional(),
  emailOtp: z.string().optional(),
  otp: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(72),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

module.exports = {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
};
