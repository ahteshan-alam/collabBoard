const express = require("express");
const { getProfile } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// "protect" runs first and checks the user is logged in before getProfile runs.
router.get("/profile", protect, asyncHandler(getProfile));

module.exports = router;
