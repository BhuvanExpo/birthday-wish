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
        const { data, error } = await resend.emails.send({
            from: 'HAPPY BIRTHDAY <hello@happybirthday.bhuvan.live>',
            to,
            subject,
            text,
        });

        if (error) {
            console.error(`Error sending email to ${to}: ${error.message} (Code: ${error.name})`);
            return false;
        }

        console.log(`Message sent successfully via Resend: ${data?.id}`);
        return true;
    } catch (err) {
        console.error(`Unexpected error sending email to ${to}: ${err.message}`);
        return false;
    }
};

module.exports = { sendEmail };
