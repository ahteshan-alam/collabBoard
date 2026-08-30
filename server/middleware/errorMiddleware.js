// Runs when a request doesn't match any route registered above it in server.js.
const notFound = (req, res, next) => {
    res.status(404);
    next(new Error(`Route not found: ${req.originalUrl}`));
};

// Express recognizes this as an error handler specifically because it takes
// 4 arguments (err, req, res, next). Any error passed to next(error) - including
// ones forwarded automatically by asyncHandler - ends up here instead of
// crashing the server or leaving the request hanging forever.
const errorHandler = (err, req, res, next) => {
    // If a controller already set a status code (like 400 or 404), keep using
    // it. Otherwise this was an unexpected error, so default to 500.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        message: err.message,
        // Only include the stack trace outside production - never expose it to real users.
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};

module.exports = { notFound, errorHandler };
