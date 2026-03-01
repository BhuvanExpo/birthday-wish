const { Resend } = require('resend');

// Initialize Resend with the provided API key
const resend = new Resend('re_gvoKTmEs_6tDJ3g1MfUbM6MBZWDvFfb5V');

/**
 * Sends an email using the Resend API.
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 */
const sendEmail = async (to, subject, text) => {
    try {
        const data = await resend.emails.send({
            from: 'Birthday Scheduler <onboarding@resend.dev>', // Resend testing domain
            to,
            subject,
            text,
        });

        console.log(`Message sent successfully via Resend: ${data.id}`);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${to}: ${error.message}`);
        return false;
    }
};

module.exports = { sendEmail };
