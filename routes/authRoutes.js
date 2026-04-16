const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .trim()
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['student', 'teacher'])
      .withMessage('Role must be student or teacher'),
    // ✅ Validate subjects array only when role is teacher
    body('subjects')
      .if(body('role').equals('teacher'))
      .isArray({ min: 1 })
      .withMessage('Teachers must add at least one subject'),
    body('subjects.*')
      .if(body('role').equals('teacher'))
      .trim()
      .notEmpty()
      .withMessage('Subject name cannot be empty'),
  ],
  register
);

// @route POST /api/auth/login
router.post('/login', login);

// @route GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;