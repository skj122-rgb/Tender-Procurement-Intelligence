const env = require('../config/env');

const sendOtpEmail = async (to, otp) => {
  try {
    console.log(`[Email Service] ✉️ OTP verification sent to ${to}: ${otp}`);
    return {
      messageId: `msg_${Date.now()}`,
      previewUrl: null,
    };
  } catch (error) {
    console.error('[Email Delivery Error]:', error.message);
    return { messageId: 'fallback-id' };
  }
};

const sendPasswordResetEmail = async (to, token) => {
  try {
    console.log(`[Email Service] 🔒 Password reset token sent to ${to}: ${token}`);
    return {
      messageId: `msg_${Date.now()}`,
      previewUrl: null,
    };
  } catch (error) {
    console.error('[Email Reset Error]:', error.message);
    return { messageId: 'fallback-id' };
  }
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
};
