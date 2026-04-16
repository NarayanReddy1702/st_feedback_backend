const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  submitFeedback, getMyFeedbacks, updateFeedback, deleteFeedback
} = require('../controllers/feedbackController');

router.post('/', protect, authorize('student'), submitFeedback);
router.get('/my', protect, authorize('student'), getMyFeedbacks);
router.put('/:id', protect, authorize('student'), updateFeedback);
router.delete('/:id', protect, deleteFeedback);

module.exports = router;