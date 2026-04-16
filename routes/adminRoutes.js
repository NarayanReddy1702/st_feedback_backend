const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getDashboardStats, getAllUsers, toggleUserApproval, deleteUser, getAllFeedback, approveFeedback
} = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserApproval);
router.delete('/users/:id', deleteUser);
router.get('/feedbacks', getAllFeedback);
router.put('/feedbacks/:id/approve', approveFeedback);

module.exports = router;
