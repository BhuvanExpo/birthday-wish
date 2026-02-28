/**
 * Utility to standardize API responses.
 */

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
    const responseData = {
        success,
        message,
    };

    if (data) responseData.data = data;
    if (error) responseData.error = error;

    return res.status(statusCode).json(responseData);
};

module.exports = {
    sendSuccess: (res, message, data) => sendResponse(res, 200, true, message, data),
    sendCreated: (res, message, data) => sendResponse(res, 201, true, message, data),
    sendError: (res, statusCode, message, error) => sendResponse(res, statusCode, false, message, null, error),
};
