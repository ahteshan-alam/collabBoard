// This file contains the actual logic for signup, login, and logout.
// Routes (see routes/authRoutes.js) just point an HTTP request at these functions.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Creates a JWT that contains the user's id, signed with our secret key.
// The server doesn't need to remember who's logged in anywhere - it just
// re-checks this signature on every request to know who's making it.
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Puts the token in an httpOnly cookie. "httpOnly" means JavaScript running in
// the browser CANNOT read this cookie (this protects the token from being
// stolen by malicious scripts) - but the browser will still automatically
// attach it to every request we make to this server.
const sendTokenAsCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

// POST /api/auth/signup
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Never save the plain-text password. bcrypt.hash() scrambles it into a
    // one-way hash - even we can't turn it back into the original password.
    // "10" is the number of hashing rounds - higher is slower to compute but more secure.
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = generateToken(user._id);
    sendTokenAsCookie(res, token);

    // Only send back safe fields - never send the password hash to the client.
    res.status(201).json({
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
    });
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please fill in all fields" });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    // bcrypt.compare() hashes the entered password the same way and checks
    // whether it matches the stored hash. We never decrypt the stored hash -
    // hashing only works one way.
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    sendTokenAsCookie(res, token);

    res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
    });
};

// POST /api/auth/logout
const logout = async (req, res) => {
    // Overwrite the cookie with an empty value that expires immediately,
    // which effectively removes it from the browser.
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.cookie("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
        expires: new Date(0),
    });
};

module.exports = { signup, login, logout };
