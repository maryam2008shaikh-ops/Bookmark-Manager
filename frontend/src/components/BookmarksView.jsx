import React, { useState, useEffect } from 'react';
import { getBookmarks, createBookmark, deleteBookmark } from '../api';
import DeleteModal from './DeleteModal';

/**
 * Bookmarks View:
 * - Form to add new bookmarks (Title + URL validation)
 * - List of user's saved bookmarks with domain badges
 * - Delete modal confirmation
 */
export default function BookmarksView({ token }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Bookmark Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Delete modal state
  const [bookmarkToDelete, setBookmarkToDelete] = useState(null);

  // Load bookmarks on mount
  useEffect(() => {
    fetchBookmarksList();
  }, [token]);

  const fetchBookmarksList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBookmarks(token);
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a bookmark
  const handleAddBookmark = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedTitle = title.trim();
    let trimmedUrl = url.trim();

    if (!trimmedTitle) {
      setError('Please provide a title for your bookmark.');
      return;
    }

    if (!trimmedUrl) {
      setError('Please provide a URL.');
      return;
    }

    // Auto-prefix http:// or https:// if omitted by user
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    // Basic format test
    try {
      new URL(trimmedUrl);
    } catch {
      setError('Please enter a valid website URL (e.g. https://github.com).');
      return;
    }

    setAdding(true);
    try {
      const data = await createBookmark(token, trimmedTitle, trimmedUrl);
      setBookmarks((prev) => [data.bookmark, ...prev]);
      setTitle('');
      setUrl('');
      setSuccessMsg('Bookmark added successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setError(err.message || 'Failed to add bookmark.');
    } finally {
      setAdding(false);
    }
  };

  // Handle confirming bookmark deletion
  const handleConfirmDelete = async (id) => {
    setDeleting(true);
    setError(null);
    try {
      await deleteBookmark(token, id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      setBookmarkToDelete(null);
      setSuccessMsg('Bookmark deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete bookmark.');
    } finally {
      setDeleting(false);
    }
  };

  // Extract hostname for pill display
  const getDomain = (rawUrl) => {
    try {
      return new URL(rawUrl).hostname.replace(/^www\./, '');
    } catch {
      return 'link';
    }
  };

  return (
    <div className="bookmarks-dashboard">
      {/* Notifications */}
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

      {/* Add Bookmark Card */}
      <div className="add-card">
        <div className="add-card-header">
          <span style={{ fontSize: '1.25rem' }}>➕</span>
          <h3 className="add-card-title">Add New Bookmark</h3>
        </div>

        <form onSubmit={handleAddBookmark} className="add-card-form">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="bookmark-title" className="form-label">
              Title
            </label>
            <input
              id="bookmark-title"
              type="text"
              className="form-input"
              placeholder="e.g. GitHub Repository"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={adding}
              maxLength={200}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="bookmark-url" className="form-label">
              URL
            </label>
            <input
              id="bookmark-url"
              type="text"
              className="form-input"
              placeholder="https://github.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={adding}
            />
          </div>

          <button
            id="add-bookmark-btn"
            type="submit"
            className="btn btn-primary"
            disabled={adding}
            style={{ height: '42px' }}
          >
            {adding ? (
              <>
                <span className="spinner"></span>
                <span>Saving...</span>
              </>
            ) : (
              'Save Bookmark'
            )}
          </button>
        </form>
      </div>

      {/* Bookmarks List Section */}
      <div>
        <div className="list-section-header">
          <h2 className="list-title">
            <span>Saved Bookmarks</span>
            <span className="count-badge">{bookmarks.length}</span>
          </h2>
          {bookmarks.length > 0 && (
            <button
              onClick={fetchBookmarksList}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              title="Refresh bookmarks list"
              disabled={loading}
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span className="spinner" style={{ width: '28px', height: '28px', color: 'var(--primary-teal)' }}></span>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Loading your bookmarks...
            </p>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3 className="empty-title">No bookmarks saved yet</h3>
            <p className="empty-subtitle">
              Use the form above to add your favorite websites and important links.
            </p>
          </div>
        ) : (
          <div className="bookmarks-grid">
            {bookmarks.map((b) => (
              <div key={b.id} className="bookmark-card">
                <div className="bookmark-info">
                  <div className="bookmark-title-row">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-title"
                      title={b.url}
                    >
                      {b.title}
                    </a>
                  </div>
                  <div className="bookmark-url-row">
                    <span className="domain-pill">{getDomain(b.url)}</span>
                    <span className="bookmark-date">
                      Saved {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="bookmark-actions">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.75rem' }}
                    title="Open link in new tab"
                  >
                    Open ↗
                  </a>
                  <button
                    onClick={() => setBookmarkToDelete(b)}
                    className="btn btn-danger-outline"
                    title="Delete bookmark"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(bookmarkToDelete)}
        bookmark={bookmarkToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBookmarkToDelete(null)}
        isDeleting={deleting}
      />
    </div>
  );
}
