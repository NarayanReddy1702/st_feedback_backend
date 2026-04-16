const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, role, subjects } = req.body;

    const allowedRoles = ['student', 'teacher'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be student or teacher.' });
    }

    // ✅ Teachers must provide at least one subject
    if (role === 'teacher') {
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: 'Teachers must have at least one subject.' });
      }
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // ✅ Clean and deduplicate subjects; students/admin get empty array
    const cleanSubjects =
      role === 'teacher'
        ? [...new Set(subjects.map((s) => s.trim()).filter(Boolean))]
        : [];

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      subjects: cleanSubjects,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subjects: user.subjects,
      isApproved: user.isApproved,
      token,
    });
  } catch (error) {
    return next(error);
  }
};

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Your account has been blocked. Contact admin.' });
    }

    const token = generateToken(user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subjects: user.subjects,
      isApproved: user.isApproved,
      token,
    });
  } catch (error) {
    return next(error);
  }
};

// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    return res.json(req.user);
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, getMe };