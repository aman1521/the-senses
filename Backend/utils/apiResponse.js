/**
 * Standardized API Response Helper
 */

exports.successResponse = (res, data, message = "Operation successful", statusCode = 200, meta = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta, // Pagination or extra metadata
        timestamp: new Date().toISOString()
    });
};

exports.errorResponse = (res, message = "Internal Server Error", statusCode = 500, error = null) => {

    // In production, hide detailed error stack unless it's a specific operational error
    const errorDetail = process.env.NODE_ENV === 'production'
        ? undefined
        : (error ? (error.stack || error.message || error) : undefined);

    return res.status(statusCode).json({
        success: false,
        message,
        error: errorDetail,
        timestamp: new Date().toISOString()
    });
};
