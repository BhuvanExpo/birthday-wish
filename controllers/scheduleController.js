const Wish = require('../models/Wish');
const Feedback = require('../models/Feedback');
const { sendSuccess, sendError, sendCreated } = require('../utils/responseHandler');

/**
 * Controller to schedule a new birthday wish
 */
const scheduleWish = async (req, res) => {
    try {
        const { senderName, receiverEmail, message, sendAt } = req.body;

        // Dates have already been validated by the middleware
        const parsedDate = new Date(sendAt);

        // Create a new wish in the database
        const wish = new Wish({
            senderName,
            receiverEmail,
            message,
            sendAt: parsedDate,
        });

        const savedWish = await wish.save();

        return sendCreated(res, 'Birthday wish scheduled successfully.', savedWish);
    } catch (error) {
        console.error(`Error scheduling wish: ${error.message}`);
        return sendError(res, 500, 'Server Error', error.message);
    }
};

/**
 * Controller to get all scheduled wishes
 */
const getWishes = async (req, res) => {
    try {
        // Sort logic defaults to earliest scheduled dates first
        const wishes = await Wish.find().sort({ sendAt: 1 });

        return sendSuccess(res, 'Wishes fetched successfully.', {
            count: wishes.length,
            wishes,
        });
    } catch (error) {
        console.error(`Error fetching wishes: ${error.message}`);
        return sendError(res, 500, 'Server Error', error.message);
    }
};

/**
 * Controller to handle user feedback submissions
 */
const submitFeedback = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!message) {
            return sendError(res, 400, 'Bad Request', 'Feedback message is required.');
        }

        const feedback = new Feedback({
            name: name || 'Anonymous',
            email: email || '',
            message
        });

        const savedFeedback = await feedback.save();

        return sendCreated(res, 'Feedback submitted successfully.', savedFeedback);
    } catch (error) {
        console.error(`Error submitting feedback: ${error.message}`);
        return sendError(res, 500, 'Server Error', 'Failed to submit feedback.');
    }
};

module.exports = {
    scheduleWish,
    getWishes,
    submitFeedback
};
