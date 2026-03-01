const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');
const Filter = require('bad-words');
const filter = new Filter();

const validateScheduleRequest = [
    body('senderName')
        .trim()
        .notEmpty()
        .withMessage('Sender name is required'),
    body('receiverEmail')
        .trim()
        .notEmpty()
        .withMessage('Receiver email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .custom((value) => {
            if (filter.isProfane(value)) {
                throw new Error('Message contains inappropriate language');
            }
            return true;
        }),
    body('sendAt')
        .notEmpty()
        .withMessage('Send at date is required')
        .isISO8601()
        .withMessage('Send at date must be a valid ISO 8601 date')
        .custom((value) => {
            const parsedDate = new Date(value);
            if (parsedDate < new Date()) {
                throw new Error('Send at date must be in the future');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 400, 'Validation failed', errors.array());
        }
        next();
    },
];

module.exports = {
    validateScheduleRequest,
};
