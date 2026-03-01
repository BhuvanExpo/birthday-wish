const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        default: 'Anonymous'
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    message: {
        type: String,
        required: [true, 'Feedback message is required'],
        trim: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
