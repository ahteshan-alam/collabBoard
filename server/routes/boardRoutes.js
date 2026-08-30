const express = require("express");
const {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard,
    inviteCollaborator,
} = require("../controllers/boardController");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Every board route requires the user to be logged in ("protect" runs first).
router.post("/", protect, asyncHandler(createBoard));
router.get("/", protect, asyncHandler(getBoards));
router.get("/:id", protect, asyncHandler(getBoardById));
router.put("/:id", protect, asyncHandler(updateBoard));
router.delete("/:id", protect, asyncHandler(deleteBoard));
router.post("/:id/invite", protect, asyncHandler(inviteCollaborator));

module.exports = router;
