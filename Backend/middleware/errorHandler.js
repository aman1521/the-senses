const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    console.error(`[Global Error] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Check for mongoose validation errors
    if (err.name === 'ValidationError') {
        return errorResponse(res, Object.values(err.errors).map(val => val.message).join(', '), 400);
    }

    // Check for duplicate key error
    if (err.code === 11000) {
        return errorResponse(res, 'Duplicate field value entered', 400);
    }

    // Check for CastError
    if (err.name === 'CastError') {
        return errorResponse(res, `Resource not found. Invalid: ${err.path}`, 404);
    }

    errorResponse(res, err.message, statusCode, process.env.NODE_ENV === 'production' ? null : err.stack);
};

module.exports = errorHandler;
