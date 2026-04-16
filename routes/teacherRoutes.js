const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// @route   GET /api/teacher/list
// @access  Student
// Returns all approved teachers with their subjects array
router.get('/list', protect, authorize('student'), async (req, res, next) => {
  try {
    const teachers = await User.find({ role: 'teacher', isApproved: true })
      .select('-password')
      .sort({ name: 1 });
    return res.json(teachers);
  } catch (error) {
    return next(error);
  }
});

// @route   GET /api/teacher/dashboard
// @access  Teacher
router.get('/dashboard', protect, authorize('teacher'), async (req, res, next) => {
  try {
    const subject = req.query.subject;
    const filter = { teacherId: req.user._id };
    if (subject) filter.subject = subject;

    const feedbacks = await Feedback.find(filter)
      .populate('studentId', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    const totalFeedback = feedbacks.length;
    const avgRating = totalFeedback
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1)
      : 0;

    // ✅ Use teacher's actual subjects array from their profile
    const teacher = await User.findById(req.user._id).select('subjects');

    return res.json({
      feedbacks,
      totalFeedback,
      avgRating,
      subjects: teacher.subjects || [],
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
