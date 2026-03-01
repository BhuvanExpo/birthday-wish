const express = require('express');
const router = express.Router();

const { scheduleWish, getWishes, submitFeedback } = require('../controllers/scheduleController');
const { validateScheduleRequest } = require('../middlewares/validationMiddleware');

/**
 * @route   POST /api/schedule
 * @desc    Schedule a new birthday wish
 * @access  Public
 */
router.post('/schedule', validateScheduleRequest, scheduleWish);

/**
 * @route   GET /api/schedule
 * @desc    Get all scheduled wishes
 * @access  Public
 */
router.get('/schedule', getWishes);

/**
 * @route   POST /api/feedback
 * @desc    Submit user feedback
 * @access  Public
 */
router.post('/feedback', submitFeedback);

module.exports = router;
