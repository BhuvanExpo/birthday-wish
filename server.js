require('dotenv').config();

// Workaround for Render Free Tier IPv6 issue with Node 18+
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const Wish = require('./models/Wish');
const { sendEmail } = require('./services/emailService');
const scheduleRoute = require('./routes/scheduleRoute');

// Initialize the Express app
const app = express();

// Middleware
app.use(cors({
    origin: '*', // For testing/production anywhere
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev')); // Logging HTTP requests

// Service Pause Middleware
app.use((req, res, next) => {
    if (process.env.PAUSE_SERVICE === 'true') {
        return res.status(503).json({
            success: false,
            message: 'Service is temporarily paused for maintenance. Please try again later.'
        });
    }
    next();
});

// Rate limiting middleware (Max 100 requests per IP per hour)
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Increased from 5 for testing
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after an hour',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes
app.use('/', apiLimiter, scheduleRoute);

app.get("/test", (req, res) => {
    res.send("Server is working");
});

app.get("/insert", async (req, res) => {
    const wish = new Wish({
        senderName: "Bhuvan",
        receiverEmail: "1432bhuva@gmail.com",
        message: "Happy Birthday 🎉",
        sendAt: new Date(Date.now() + 60000), // 1 minute from now
    });

    await wish.save();
    res.send("Wish scheduled for 1 minute later");
});

// Cron Job: Runs every minute to check for pending or failed (with retries) messages
cron.schedule('* * * * *', async () => {
    console.log('Cron job running: Checking for pending birthday wishes...');

    try {
        const now = new Date();

        // Find wishes that are pending and scheduled for now or the past
        // Or failed wishes that have a retry count < 3
        const pendingWishes = await Wish.find({
            $or: [
                { status: 'pending', sendAt: { $lte: now } },
                { status: 'failed', retryCount: { $lt: 3 }, sendAt: { $lte: now } }
            ]
        });

        if (pendingWishes.length === 0) {
            console.log('No eligible wishes found.');
            return;
        }

        console.log(`Found ${pendingWishes.length} wishes to process.`);

        for (const wish of pendingWishes) {
            const subject = `Happy Birthday, ${wish.senderName}!`;
            const text = wish.message;

            console.log(`Attempting to send wish to ${wish.receiverEmail} (Attempt ${wish.retryCount + 1})`);

            console.log(`Sending email to ${wish.receiverEmail}...`);
            const isSuccess = await sendEmail(wish.receiverEmail, subject, text);

            if (isSuccess) {
                // Mark as sent in the database
                wish.status = 'sent';
                await wish.save();
                console.log(`Wish successfully sent and updated for ${wish.senderName}`);
            } else {
                // Increment retry count
                wish.retryCount += 1;

                if (wish.retryCount >= 3) {
                    console.error(`Failed to send wish for ${wish.senderName} after 3 attempts.`);
                    wish.status = 'failed';
                } else {
                    console.error(`Failed to send wish for ${wish.senderName}. Retrying later...`);
                    wish.status = 'failed'; // Set status to failed but retryCount is < 3 so it will retry
                }
                await wish.save();
            }
        }
    } catch (error) {
        console.error(`Error in cron job: ${error.message}`);
    }
});

// Define the port, defaulting to 3000
const PORT = process.env.PORT || 3000;

// Connect to database, then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
