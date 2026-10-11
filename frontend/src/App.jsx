import React, { useState, useEffect } from 'react';
import AuthView from './components/AuthView';
import BookmarksView from './components/BookmarksView';

/**
 * Main Application Component
 * Controls Authentication state and view switching
 */
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('bm_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('bm_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Save session to localStorage
  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('bm_token', newToken);
    localStorage.setItem('bm_user', JSON.stringify(newUser));
  };

  // Secure logout handler
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bm_token');
    localStorage.removeItem('bm_user');
  };

  return (
    <div className="app-wrapper">
      {/* Top Navigation */}
      <header className="navbar">
        <a href="/" className="brand">
          <div className="brand-icon">🔖</div>
          <span>BookMark Manager</span>
        </a>

        {token && user && (
          <div className="user-nav-actions">
            <div className="user-badge" title="Authenticated User">
              <span className="phone-dot"></span>
              <span>{user.phone}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}
              title="End session and log out"
            >
              Log Out
            </button>
          </div>
        )}
      </header>

      {/* Main Views Container */}
      <main className="main-content">
        {!token ? (
          <AuthView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <BookmarksView token={token} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>BookMark Manager &bull; WhatsApp OTP Authentication by MiniMoth &bull; SQLite Database</p>
      </footer>
    </div>
  );
}
