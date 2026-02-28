const nodemailer = require('nodemailer');

/**
 * Creates and configures a nodemailer transport.
 * Reads SMTP credentials from environment variables.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    // Force IPv4 lookup for Render's network
    localAddress: '0.0.0.0'
});

/**
 * Sends an email using the configured transporter.
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 */
const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"Birthday Scheduler" <1432bhuva@gmail.com>',
            to,
            subject,
            text,
        });
        console.log(`Message sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${to}: ${error.message}`);
        return false;
    }
};

module.exports = { sendEmail };
