import React from 'react';

/**
 * Delete Confirmation Modal
 * Prevents accidental bookmark deletions
 */
export default function DeleteModal({ isOpen, bookmark, onConfirm, onCancel, isDeleting }) {
  if (!isOpen || !bookmark) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon">⚠️</div>
          <h3 className="modal-title">Delete Bookmark</h3>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to delete this bookmark? This action cannot be undone.</p>
          <div className="modal-bookmark-preview">
            {bookmark.title}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(bookmark.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="spinner"></span>
                <span>Deleting...</span>
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
