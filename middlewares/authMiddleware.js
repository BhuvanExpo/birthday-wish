const { OAuth2Client } = require('google-auth-library');
const { sendError } = require('../utils/responseHandler');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 401, 'Unauthorized', 'No token provided in Authorization header');
        }

        const token = authHeader.split(' ')[1];

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("Missing GOOGLE_CLIENT_ID in environment variables.");
            return sendError(res, 500, 'Server Error', 'Google Auth configuration missing on server');
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Ensure email is verified by Google
        if (!payload.email_verified) {
            return sendError(res, 403, 'Forbidden', 'Google email is not verified');
        }

        // Attach verified email to req object
        req.user = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            googleId: payload.sub
        };

        next();
    } catch (error) {
        console.error('Google Token Verification Error:', error.message);
        return sendError(res, 401, 'Unauthorized', 'Invalid or expired Google token');
    }
};

module.exports = {
    verifyGoogleToken
};
