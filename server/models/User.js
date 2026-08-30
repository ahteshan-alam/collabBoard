// This file defines the "shape" of a User document in MongoDB using Mongoose.
// A Schema is like a blueprint: it describes what fields a User has, their types,
// and simple validation rules (e.g. "email is required"). Mongoose then turns
// that Schema into a Model, which is the actual object we use to create, find,
// update, and delete users in the database (e.g. User.findOne({ email })).

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true, // no two users can sign up with the same email
        },
        password: {
            type: String,
            required: true,
            // This will always be a bcrypt HASH, never the real password.
            // See server/controllers/authController.js (Phase 4) for where hashing happens.
        },
        profileImage: {
            type: String,
            default: "", // empty string until the user uploads one
        },
    },
    {
        // Automatically adds "createdAt" and "updatedAt" fields and keeps them
        // up to date, so we don't have to manage them by hand.
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);
