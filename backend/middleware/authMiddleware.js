// This middleware protects routes that should only be accessible to logged-in
// users. It reads the JWT from the httpOnly cookie, verifies it, and - if valid -
// attaches the logged-in user to req.user so the route handler after it can use it.
//
// Usage: router.get("/profile", protect, getProfile)
// Express runs "protect" first. If it calls next(), Express moves on to "getProfile".
// If it sends a response instead (like a 401), "getProfile" never runs.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not authorized, please log in" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // "-password" tells Mongoose to fetch everything EXCEPT the password
        // field, so we never accidentally attach the password hash to req.user.
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Not authorized, user not found" });
        }

        req.user = user;
        next(); // move on to the actual route handler
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, invalid token" });
    }
};

module.exports = protect;
