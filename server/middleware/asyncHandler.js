// A tiny helper that wraps an async route handler and forwards any error it
// throws to Express's error-handling middleware (see errorMiddleware.js).
//
// Without this, Express 4 does NOT automatically catch errors thrown inside
// an async function - the request would just hang instead of returning a
// clean error response. Instead of writing a try/catch in every single
// controller function, we wrap the function once with this.
//
// Usage: router.post("/signup", asyncHandler(signup));
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
