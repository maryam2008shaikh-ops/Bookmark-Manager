/**
 * MiniMoth WhatsApp/SMS OTP Authentication Service
 * 
 * Official MiniMoth API Integration:
 * - Base URL: https://api.minimoth.dev
 * - Authentication: X-Api-Key header
 * - Primary delivery: WhatsApp
 * - Fallback: SMS (automatic)
 * 
 * Documentation Reference: https://minimoth.dev/docs
 */

const BASE_URL = process.env.MINIMOTH_BASE_URL || 'https://api.minimoth.dev';

/**
 * Normalizes phone numbers to E.164 format.
 * - Strips all spaces, dashes, parentheses.
 * - If 10 digits starting with 6-9 (Indian mobile), prefixes with +91.
 * - If already starting with '+', verifies digit length.
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Phone number is required and must be a string.');
  }

  // Remove whitespace, dashes, parens
  const cleaned = rawPhone.replace(/[\s\-\(\)]/g, '');

  // 10 digits starting with 6-9 -> Indian domestic number
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // E.164 format with country code (e.g. +919876543210 or +12025551234)
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error('Please enter a valid phone number (e.g. +919876543210 or 10-digit Indian mobile number).');
}

/**
 * Sends a WhatsApp OTP using MiniMoth's POST /v1/otp/send.
 * 
 * @param {string} phone - Normalized E.164 phone number
 * @returns {Promise<{ otpId: string, expiresAt: string }>}
 */
export async function sendOtp(phone) {
  const apiKey = (process.env.MINIMOTH_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey || apiKey === 'your_minimoth_api_key_here') {
    const error = new Error('MiniMoth API Key is not configured. Please set MINIMOTH_API_KEY in backend/.env');
    error.status = 503;
    error.code = 'CONFIG_MISSING';
    throw error;
  }

  const endpoint = `${BASE_URL}/v1/otp/send`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = getReadableErrorMessage(data.code || 'SEND_FAILED', data.error);
    const error = new Error(message);
    error.status = response.status;
    error.code = data.code || 'UNKNOWN_ERROR';
    throw error;
  }

  return {
    otpId: data.otp_id,
    expiresAt: data.expires_at
  };
}

/**
 * Verifies a WhatsApp OTP using MiniMoth's POST /v1/otp/verify.
 * 
 * @param {string} phone - Normalized E.164 phone number
 * @param {string} code - 6-digit OTP string
 * @returns {Promise<{ accessToken: string, refreshToken: string, identityId?: string }>}
 */
export async function verifyOtp(phone, code) {
  const apiKey = (process.env.MINIMOTH_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');

  if (!apiKey || apiKey === 'your_minimoth_api_key_here') {
    const error = new Error('MiniMoth API Key is not configured. Please set MINIMOTH_API_KEY in backend/.env');
    error.status = 503;
    error.code = 'CONFIG_MISSING';
    throw error;
  }

  if (!code || !/^\d{6}$/.test(code.trim())) {
    const error = new Error('OTP code must be exactly 6 digits.');
    error.status = 400;
    error.code = 'INVALID_OTP_CODE';
    throw error;
  }

  const endpoint = `${BASE_URL}/v1/otp/verify`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, code: code.trim() })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = getReadableErrorMessage(data.code || 'VERIFY_FAILED', data.error);
    const error = new Error(message);
    error.status = response.status;
    error.code = data.code || 'UNKNOWN_ERROR';
    throw error;
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    identityId: data.identity_id,
    expiresAt: data.expires_at
  };
}

/**
 * Helper to map MiniMoth error codes into user-friendly workshop messages
 */
function getReadableErrorMessage(code, defaultMessage) {
  switch (code) {
    case 'MISSING_API_KEY':
    case 'INVALID_API_KEY':
      return 'MiniMoth authentication failed: Invalid or missing API key in backend configuration.';
    case 'OTP_RATE_LIMITED':
      return 'Too many OTP requests for this phone number. Please wait a few minutes before trying again.';
    case 'INSUFFICIENT_BALANCE':
      return 'MiniMoth account balance is insufficient to dispatch OTP. Please check wallet balance in dashboard.';
    case 'INVALID_PHONE':
      return 'The phone number is not a valid mobile number.';
    case 'SMS_FAILED':
      return 'Delivery failed across WhatsApp and fallback SMS. Please try again.';
    case 'INVALID_OTP':
      return 'Invalid verification code. Please check the code and try again.';
    case 'OTP_NOT_FOUND':
      return 'OTP has expired or has already been used. Please request a new OTP.';
    case 'VERIFY_RATE_LIMITED':
      return 'Too many incorrect attempts. This OTP has been invalidated. Please request a new OTP.';
    case 'REGION_NOT_ENABLED':
      return 'International WhatsApp OTP is not enabled for this region in your MiniMoth dashboard.';
    default:
      return defaultMessage || 'An unexpected error occurred during OTP authentication.';
  }
}
