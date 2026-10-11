import jwt from 'jsonwebtoken';
import { findUserById } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bookmark_manager_default_secret_key_change_me';

/**
 * Authentication middleware that verifies JWT Bearer tokens
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token required.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User associated with session not found.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid session token. Please log in again.'
    });
  }
}

/**
 * Helper function to generate signed JWT token for verified user
 */
export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      phone: user.phone_number
    },
    JWT_SECRET,
    { expiresIn: '7d' } // 7-day token expiry
  );
}
