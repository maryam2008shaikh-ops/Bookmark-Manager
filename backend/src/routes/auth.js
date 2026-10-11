import express from 'express';
import { normalizePhoneNumber, sendOtp, verifyOtp } from '../services/minimoth.js';
import { throttleSendOtp, throttleVerifyOtp, resetVerifyAttempts } from '../middleware/rateLimit.js';
import { findUserByPhone, createUser } from '../db.js';
import { signAuthToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Route 1: POST /api/auth/send-otp
 * - Validates phone number
 * - Applies in-memory rate limiting
 * - Sends WhatsApp OTP via MiniMoth
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Phone number is required.'
      });
    }

    let normalizedPhone;
    try {
      normalizedPhone = normalizePhoneNumber(phone);
    } catch (valErr) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: valErr.message
      });
    }

    // Apply throttling
    const throttle = throttleSendOtp(normalizedPhone);
    if (!throttle.allowed) {
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: throttle.message
      });
    }

    // Call real MiniMoth API
    const result = await sendOtp(normalizedPhone);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your WhatsApp (with SMS fallback).',
      phone: normalizedPhone,
      otpId: result.otpId,
      expiresAt: result.expiresAt
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.code || 'SEND_OTP_FAILED',
      message: err.message || 'Failed to dispatch OTP.'
    });
  }
});

/**
 * Route 2: POST /api/auth/verify-otp
 * - Validates phone number and OTP code
 * - Checks verify attempt rate limit
 * - Verifies OTP with MiniMoth
 * - Registers new user or finds existing user in SQLite
 * - Issues authentication token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Phone number and 6-digit OTP code are required.'
      });
    }

    let normalizedPhone;
    try {
      normalizedPhone = normalizePhoneNumber(phone);
    } catch (valErr) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: valErr.message
      });
    }

    // Throttle verify attempts
    const throttle = throttleVerifyOtp(normalizedPhone);
    if (!throttle.allowed) {
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: throttle.message
      });
    }

    // Call real MiniMoth API to verify OTP
    await verifyOtp(normalizedPhone, otp);

    // If verification succeeded, reset verify attempts
    resetVerifyAttempts(normalizedPhone);

    // Find or create user in SQLite database
    let user = findUserByPhone(normalizedPhone);
    let isNewUser = false;

    if (!user) {
      user = createUser(normalizedPhone);
      isNewUser = true;
    }

    // Generate signed session token
    const token = signAuthToken(user);

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Account registered successfully.' : 'Welcome back! Logged in successfully.',
      token,
      user: {
        id: user.id,
        phone: user.phone_number,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({
      error: err.code || 'VERIFICATION_FAILED',
      message: err.message || 'OTP verification failed.'
    });
  }
});

export default router;
