// This file is responsible for one thing only: connecting to MongoDB.
// We keep it separate from server.js so that "how do we connect to the database"
// is easy to find in one place.

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // mongoose.connect() returns a promise, so we await it.
        // MONGO_URI comes from our .env file (see .env.example).
        const connection = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB connected: ${connection.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed:", error.message);

        // If we can't connect to the database, the app can't do anything useful,
        // so we stop the server instead of continuing in a broken state.
        process.exit(1);
    }
};

module.exports = connectDB;
