import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path inside backend root
const dbPath = path.resolve(__dirname, '../bookmarks.db');

// Initialize SQLite database instance
const db = new Database(dbPath);

// Enable foreign key constraints and Write-Ahead Logging for concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Automatically create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('Database initialized successfully at:', dbPath);

/**
 * User Queries
 */
export function findUserByPhone(phoneNumber) {
  const stmt = db.prepare('SELECT id, phone_number, created_at FROM users WHERE phone_number = ?');
  return stmt.get(phoneNumber);
}

export function createUser(phoneNumber) {
  const stmt = db.prepare('INSERT INTO users (phone_number) VALUES (?)');
  const info = stmt.run(phoneNumber);
  return {
    id: info.lastInsertRowid,
    phone_number: phoneNumber,
    created_at: new Date().toISOString()
  };
}

export function findUserById(id) {
  const stmt = db.prepare('SELECT id, phone_number, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * Bookmark Queries
 */
export function getBookmarksByUserId(userId) {
  const stmt = db.prepare('SELECT id, user_id, title, url, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId);
}

export function createBookmark(userId, title, url) {
  const stmt = db.prepare('INSERT INTO bookmarks (user_id, title, url) VALUES (?, ?, ?)');
  const info = stmt.run(userId, title, url);
  return {
    id: info.lastInsertRowid,
    user_id: userId,
    title,
    url,
    created_at: new Date().toISOString()
  };
}

export function getBookmarkById(id) {
  const stmt = db.prepare('SELECT id, user_id, title, url, created_at FROM bookmarks WHERE id = ?');
  return stmt.get(id);
}

export function deleteBookmarkByIdAndUserId(id, userId) {
  const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ? AND user_id = ?');
  const info = stmt.run(id, userId);
  return info.changes > 0;
}

export default db;
