const { Resend } = require('resend');

const resend = new Resend('re_gvoKTmEs_6tDJ3g1MfUbM6MBZWDvFfb5V');

async function testSend() {
    try {
        console.log('Attempting to send an email using Resend...');
        const response = await resend.emails.send({
            from: 'HAPPY BIRTHDAY <hello@happybirthday.bhuvan.live>',
            to: 'bhuvangm@hotmail.com', // User's email from test route
            subject: 'Test Email Delivery',
            text: 'This is a test email to verify Resend delivery.',
        });
        console.log('Response from Resend:');
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Error from Resend:', error);
    }
}

testSend();
