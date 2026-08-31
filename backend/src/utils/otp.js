const crypto = require('crypto');

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const verifyOtpHash = (candidate, storedHash) => {
  const candidateHash = hashOtp(candidate);
  const candidateBuffer = Buffer.from(candidateHash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
};
