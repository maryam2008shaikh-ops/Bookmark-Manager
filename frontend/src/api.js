/**
 * API client for BookMark Manager
 * Handles backend requests with token authentication and structured error reporting.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to handle fetch responses and parse errors uniformly
 */
async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.code = data.error;
    throw error;
  }
  return data;
}

/**
 * Route 1: POST /api/auth/send-otp
 */
export async function sendOtp(phone) {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return handleResponse(res);
}

/**
 * Route 2: POST /api/auth/verify-otp
 */
export async function verifyOtp(phone, otp) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  return handleResponse(res);
}

/**
 * Route 3: GET /api/bookmarks
 */
export async function getBookmarks(token) {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

/**
 * Route 4: POST /api/bookmarks
 */
export async function createBookmark(token, title, url) {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, url })
  });
  return handleResponse(res);
}

/**
 * Route 5: DELETE /api/bookmarks/:id
 */
export async function deleteBookmark(token, id) {
  const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(res);
}
