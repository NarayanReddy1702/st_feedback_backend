const User = require('../models/User');
const Feedback = require('../models/Feedback');

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalFeedback = await Feedback.countDocuments();
    const activeUsers = await User.countDocuments({ isApproved: true });
    res.json({ totalStudents, totalTeachers, totalFeedback, activeUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  const { role } = req.query;
  try {
    const filter = role ? { role } : { role: { $in: ['student', 'teacher'] } };
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleUserApproval = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isApproved = !user.isApproved;
    await user.save();
    res.json({ message: `User ${user.isApproved ? 'approved' : 'blocked'}`, isApproved: user.isApproved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Feedback.deleteMany({ $or: [{ studentId: req.params.id }, { teacherId: req.params.id }] });
    res.json({ message: 'User and related data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveFeedback = async (req, res) => {
  try {
    const { adminResponse } = req.body;

    if (!adminResponse || !adminResponse.trim()) {
      return res.status(400).json({ message: 'Admin response is required' });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = 'approved';
    feedback.adminResponse = adminResponse.trim();
    feedback.approvedBy = req.user._id;
    feedback.approvedAt = new Date();

    await feedback.save();

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email')
      .populate('approvedBy', 'name email');

    res.json(populatedFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserApproval,
  deleteUser,
  getAllFeedback,
  approveFeedback,
};
