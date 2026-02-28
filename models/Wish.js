const mongoose = require('mongoose');

// Mongoose schema for a birthday wish
const wishSchema = new mongoose.Schema(
    {
        senderName: {
            type: String,
            required: true,
            trim: true,
        },
        receiverEmail: {
            type: String,
            required: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        message: {
            type: String,
            required: true,
        },
        sendAt: {
            type: Date,
            required: true,
            set: (val) => new Date(val).toISOString(), // Coerce to UTC
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed'],
            default: 'pending',
        },
        retryCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Wish = mongoose.model('Wish', wishSchema);

module.exports = Wish;
