const Feedback = require('../models/Feedback');
const User = require('../models/User');

const getDayRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return { startOfDay, endOfDay };
};

// @route   POST /api/feedback
// @access  Student
const submitFeedback = async (req, res, next) => {
  try {
    const { teacherId, subject, rating, comment } = req.body;

    if (!teacherId || !subject || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!teacher.subjects.includes(subject)) {
      return res.status(400).json({
        message: `"${subject}" is not a subject taught by this teacher`,
      });
    }

    const { startOfDay, endOfDay } = getDayRange();
    const existingFeedback = await Feedback.findOne({
      studentId: req.user._id,
      teacherId,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: 'You can submit feedback to this teacher only once per day',
      });
    }

    const feedback = await Feedback.create({
      studentId: req.user._id,
      teacherId,
      subject,
      rating,
      comment,
      // status defaults to 'pending', adminResponse defaults to ''
    });

    return res.status(201).json(feedback);
  } catch (error) {
    return next(error);
  }
};

// @route   GET /api/feedback/my
// @access  Student
const getMyFeedbacks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const feedbacks = await Feedback.find({ studentId: req.user._id })
      .populate('teacherId', 'name subjects')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Feedback.countDocuments({ studentId: req.user._id });

    return res.json({
      feedbacks,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

// @route   PUT /api/feedback/:id
// @access  Student
const updateFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this feedback' });
    }

    // ✅ Block editing once approved
    if (feedback.status === 'approved') {
      return res.status(403).json({ message: 'Approved feedback cannot be edited' });
    }

    if (req.body.subject && req.body.subject !== feedback.subject) {
      const teacher = await User.findById(feedback.teacherId);
      if (!teacher.subjects.includes(req.body.subject)) {
        return res.status(400).json({
          message: `"${req.body.subject}" is not a subject taught by this teacher`,
        });
      }
    }

    // ✅ Prevent students from tampering with status/adminResponse
    const { comment, rating, subject } = req.body;

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { comment, rating, subject },
      { new: true, runValidators: true }
    ).populate('teacherId', 'name subjects');

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

// @route   DELETE /api/feedback/:id
// @access  Student or Admin
const deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const isOwner = feedback.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this feedback' });
    }

    // ✅ Students cannot delete approved feedback
    if (isOwner && !isAdmin && feedback.status === 'approved') {
      return res.status(403).json({ message: 'Approved feedback cannot be deleted' });
    }

    await feedback.deleteOne();
    return res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { submitFeedback, getMyFeedbacks, updateFeedback, deleteFeedback };
