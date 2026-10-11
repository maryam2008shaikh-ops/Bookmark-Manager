import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import bookmarkRoutes from './routes/bookmarks.js';
import './db.js'; // Ensure database is initialized

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Narrow CORS configuration for frontend origin
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Body parsing middleware
app.use(express.json());

// Five application API endpoints:
// 1. POST /api/auth/send-otp
// 2. POST /api/auth/verify-otp
// 3. GET /api/bookmarks
// 4. POST /api/bookmarks
// 5. DELETE /api/bookmarks/:id
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Global 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found.'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` BookMark Manager Backend running on:`);
  console.log(` http://localhost:${PORT}`);
  console.log(` Database: SQLite (bookmarks.db)`);
  console.log(` WhatsApp OTP Provider: MiniMoth`);
  console.log(` Allowed Frontend: ${FRONTEND_URL}`);
  console.log(`=========================================`);
});
