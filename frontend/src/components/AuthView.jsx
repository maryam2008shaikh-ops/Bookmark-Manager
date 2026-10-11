import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../api';

/**
 * Authentication View:
 * 1. Phone number submission -> Triggers WhatsApp OTP via backend MiniMoth service
 * 2. 6-digit OTP verification -> Registers / logs in user and establishes session
 */
export default function AuthView({ onLoginSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Handle requesting WhatsApp OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = phone.trim();
    if (!trimmed) {
      setError('Please enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendOtp(trimmed);
      setSuccessMsg(data.message || 'OTP dispatched to your WhatsApp!');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying received OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(phone.trim(), trimmedOtp);
      setSuccessMsg(data.message || 'Authentication successful!');
      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to change phone number
  const handleChangePhone = () => {
    setStep('phone');
    setOtp('');
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-badge-icon">🔖</div>
          <h2 className="auth-title">Welcome to BookMark Manager</h2>
          <p className="auth-subtitle">
            {step === 'phone'
              ? 'Enter your mobile number to receive a WhatsApp OTP'
              : 'Enter the 6-digit verification code sent to your phone'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" role="status">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="phone-input" className="form-label">
                Mobile Number
              </label>
              <input
                id="phone-input"
                type="tel"
                className="form-input"
                placeholder="e.g. +91 98765 43210 or 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <p className="form-hint">
                Enter your 10-digit Indian phone number or international number with country code.
              </p>
            </div>

            <button
              id="send-otp-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Sending OTP...</span>
                </>
              ) : (
                'Send WhatsApp OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label htmlFor="otp-input" className="form-label" style={{ marginBottom: 0 }}>
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleChangePhone}
                  className="btn btn-outline"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  disabled={loading}
                >
                  Change Phone
                </button>
              </div>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="form-input"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }}
              />
              <p className="form-hint">
                OTP sent via WhatsApp to <strong>{phone}</strong> (with automatic SMS fallback).
              </p>
            </div>

            <button
              id="verify-otp-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify & Log In'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleSendOtp}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Official MiniMoth Badge to reassure users regarding WhatsApp sender */}
        <div className="powered-by-box">
          <a
            href="https://minimoth.dev?utm_source=powered_by"
            target="_blank"
            rel="noopener noreferrer"
            className="powered-by-link"
            title="MiniMoth handles WhatsApp-first OTP authentication"
          >
            <span>Secured & Delivered by</span>
            <img
              src="https://minimoth.dev/powered-by/powered-by-light-logo.svg"
              alt="Powered by MiniMoth"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
