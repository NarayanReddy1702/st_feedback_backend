const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars first
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Route imports ────────────────────────────────────────
const authRoutes     = require('./routes/authRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const teacherRoutes  = require('./routes/teacherRoutes');
const adminRoutes    = require('./routes/adminRoutes');

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/teacher',  teacherRoutes);
app.use('/api/admin',    adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Feedback System API Running ✅' });
});

// 404 handler — unknown routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────
// Must have 4 parameters for Express to treat it as an error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages[0] });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // JWT errors (shouldn't reach here, but just in case)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});