import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getBookmarksByUserId,
  createBookmark,
  getBookmarkById,
  deleteBookmarkByIdAndUserId
} from '../db.js';

const router = express.Router();

// Apply authentication middleware to all bookmark routes
router.use(requireAuth);

/**
 * Route 3: GET /api/bookmarks
 * - Returns all bookmarks owned by the authenticated user
 */
router.get('/', (req, res) => {
  try {
    const bookmarks = getBookmarksByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      bookmarks
    });
  } catch (err) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve bookmarks.'
    });
  }
});

/**
 * Route 4: POST /api/bookmarks
 * - Validates title and URL
 * - Saves bookmark associated with req.user.id
 */
router.post('/', (req, res) => {
  try {
    const { title, url } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'INVALID_TITLE',
        message: 'A valid bookmark title is required.'
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        error: 'TITLE_TOO_LONG',
        message: 'Bookmark title cannot exceed 200 characters.'
      });
    }

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        error: 'INVALID_URL',
        message: 'A valid URL is required.'
      });
    }

    const trimmedUrl = url.trim();

    // Validate URL protocol and structure
    try {
      const parsedUrl = new URL(trimmedUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({
          error: 'INVALID_URL_PROTOCOL',
          message: 'URL must start with http:// or https://'
        });
      }
    } catch {
      return res.status(400).json({
        error: 'INVALID_URL_FORMAT',
        message: 'Please provide a properly formatted URL (e.g. https://example.com).'
      });
    }

    const newBookmark = createBookmark(req.user.id, title.trim(), trimmedUrl);

    return res.status(201).json({
      success: true,
      message: 'Bookmark created successfully.',
      bookmark: newBookmark
    });
  } catch (err) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to save bookmark.'
    });
  }
});

/**
 * Route 5: DELETE /api/bookmarks/:id
 * - Deletes bookmark only if it belongs to the authenticated user
 */
router.delete('/:id', (req, res) => {
  try {
    const bookmarkId = parseInt(req.params.id, 10);

    if (isNaN(bookmarkId)) {
      return res.status(400).json({
        error: 'INVALID_ID',
        message: 'Bookmark ID must be a valid integer.'
      });
    }

    // Check if bookmark exists
    const existing = getBookmarkById(bookmarkId);
    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Bookmark not found.'
      });
    }

    // Verify ownership
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You do not have permission to delete this bookmark.'
      });
    }

    const deleted = deleteBookmarkByIdAndUserId(bookmarkId, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Bookmark not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bookmark deleted successfully.'
    });
  } catch (err) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to delete bookmark.'
    });
  }
});

export default router;
