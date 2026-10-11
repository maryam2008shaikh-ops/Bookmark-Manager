/**
 * Simple in-memory rate limiter for OTP requests and verification attempts.
 * Prevents endpoint abuse and brute-force attacks.
 */

// Key: phone number -> { count, firstAttemptTime }
const sendAttempts = new Map();
const verifyAttempts = new Map();

// Limits
const SEND_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SENDS_PER_WINDOW = 3;         // 3 sends per 10 minutes (matches MiniMoth live rate)

const VERIFY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFIES_PER_WINDOW = 5;       // 5 verify attempts per 10 minutes

/**
 * Throttle OTP Send Requests
 */
export function throttleSendOtp(phone) {
  const now = Date.now();
  const record = sendAttempts.get(phone);

  if (!record || now - record.firstAttemptTime > SEND_WINDOW_MS) {
    sendAttempts.set(phone, { count: 1, firstAttemptTime: now });
    return { allowed: true };
  }

  if (record.count >= MAX_SENDS_PER_WINDOW) {
    const minutesLeft = Math.ceil((SEND_WINDOW_MS - (now - record.firstAttemptTime)) / 60000);
    return {
      allowed: false,
      message: `Too many OTP requests. Please wait ${minutesLeft} minute(s) before requesting again.`
    };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Throttle OTP Verification Attempts
 */
export function throttleVerifyOtp(phone) {
  const now = Date.now();
  const record = verifyAttempts.get(phone);

  if (!record || now - record.firstAttemptTime > VERIFY_WINDOW_MS) {
    verifyAttempts.set(phone, { count: 1, firstAttemptTime: now });
    return { allowed: true };
  }

  if (record.count >= MAX_VERIFIES_PER_WINDOW) {
    const minutesLeft = Math.ceil((VERIFY_WINDOW_MS - (now - record.firstAttemptTime)) / 60000);
    return {
      allowed: false,
      message: `Too many failed verification attempts. Please wait ${minutesLeft} minute(s) or request a new OTP.`
    };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * Reset verification counter after successful verification
 */
export function resetVerifyAttempts(phone) {
  verifyAttempts.delete(phone);
}
