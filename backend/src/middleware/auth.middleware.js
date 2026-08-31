const { verifyAccessToken } = require('../utils/jwt');
const db = require('../config/database');

/**
 * Authentication middleware.
 * Extracts JWT from Authorization: Bearer <token> header,
 * verifies it, checks the blacklist, and attaches decoded payload to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT using our utility (uses JWT_ACCESS_SECRET from env)
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Check if token JTI is blacklisted (logout support)
    if (decoded.jti) {
      const result = await db.query(
        'SELECT id FROM token_blacklist WHERE token_jti = $1 AND expires_at > NOW()',
        [decoded.jti]
      );

      if (result.rows.length > 0) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }
    }

    // Attach user payload to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = {
  authenticate,
};
