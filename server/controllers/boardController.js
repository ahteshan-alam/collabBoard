// This file contains the logic behind every board-related API endpoint:
// create, list, view, update (save), delete, and invite a collaborator.
// Every function here assumes the "protect" middleware has already run,
// so req.user is always the logged-in user.

const mongoose = require("mongoose");
const Board = require("../models/Board");
const User = require("../models/User");

// Figures out what role (if any) a user has on a board: "owner", "editor",
// "viewer", or null if they have no access at all. Every permission check in
// this file is built on top of this one function, so there's a single place
// that decides who's allowed to do what - see the OWNER/EDITOR/VIEWER
// capabilities list in the project spec for what each role can do.
const getUserRole = (board, userId) => {
    const ownerId = board.owner._id
        ? board.owner._id.toString()
        : board.owner.toString();

    if (ownerId === userId.toString()) {
        return "owner";
    }

    const collaborator = board.collaborators.find(
        (collaborator) => collaborator.user.toString() === userId.toString()
    );

    return collaborator ? collaborator.role : null;
};

// POST /api/boards
const createBoard = async (req, res) => {
    const { title } = req.body;

    const board = await Board.create({
        title: title || "Untitled Board",
        owner: req.user._id,
    });

    res.status(201).json(board);
};

// GET /api/boards
// Returns every board the logged-in user owns OR has been added to as a collaborator.
const getBoards = async (req, res) => {
    const boards = await Board.find({
        $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
    })
        .populate("owner", "name email")
        .sort({ updatedAt: -1 }); // most recently updated boards first

    res.status(200).json(boards);
};

// GET /api/boards/:id
const getBoardById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
    }

    const board = await Board.findById(id).populate("owner", "name email");

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    const role = getUserRole(board, req.user._id);

    if (!role) {
        return res.status(403).json({ message: "You do not have access to this board" });
    }

    // Send the board data plus the caller's OWN role, so the frontend knows
    // whether to show drawing tools or a read-only view, without having to
    // re-derive "am I the owner?" itself.
    const boardData = board.toObject();
    boardData.currentUserRole = role;

    res.status(200).json(boardData);
};

// PUT /api/boards/:id
// Used both for renaming a board and for saving its drawn elements.
const updateBoard = async (req, res) => {
    const { id } = req.params;
    const { title, elements } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
    }

    const board = await Board.findById(id);

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    const role = getUserRole(board, req.user._id);

    if (!role) {
        return res.status(403).json({ message: "You do not have access to this board" });
    }

    if (role === "viewer") {
        return res.status(403).json({ message: "Viewers cannot edit this board" });
    }

    // Only overwrite fields that were actually sent, so a request that just
    // saves elements doesn't accidentally wipe out the title, and vice versa.
    if (title !== undefined) {
        // Renaming the board counts as "Edit board", which the spec lists as
        // an OWNER-only capability - editors can change elements, not the title.
        if (role !== "owner") {
            return res.status(403).json({ message: "Only the owner can rename this board" });
        }

        board.title = title;
    }

    if (elements !== undefined) {
        // Both "owner" and "editor" reach here - "viewer" was already
        // rejected above.
        board.elements = elements;
    }

    const updatedBoard = await board.save();

    res.status(200).json(updatedBoard);
};

// DELETE /api/boards/:id
// Only the owner is allowed to delete a board - collaborators cannot.
const deleteBoard = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
    }

    const board = await Board.findById(id);

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    if (getUserRole(board, req.user._id) !== "owner") {
        return res.status(403).json({ message: "Only the owner can delete this board" });
    }

    await board.deleteOne();

    res.status(200).json({ message: "Board deleted successfully" });
};

// POST /api/boards/:id/invite
// Lets the owner share a board with another user by email.
const inviteCollaborator = async (req, res) => {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid board ID" });
    }

    if (!email) {
        return res.status(400).json({ message: "Please provide an email to invite" });
    }

    const board = await Board.findById(id);

    if (!board) {
        return res.status(404).json({ message: "Board not found" });
    }

    if (getUserRole(board, req.user._id) !== "owner") {
        return res.status(403).json({ message: "Only the owner can invite collaborators" });
    }

    const userToInvite = await User.findOne({ email });

    if (!userToInvite) {
        return res.status(404).json({ message: "No user found with that email" });
    }

    if (userToInvite._id.toString() === board.owner.toString()) {
        return res.status(400).json({ message: "This user already owns the board" });
    }

    const existingCollaborator = board.collaborators.find(
        (collaborator) => collaborator.user.toString() === userToInvite._id.toString()
    );

    if (existingCollaborator) {
        // Already a collaborator - update their role instead of adding a duplicate entry.
        existingCollaborator.role = role || "editor";
    } else {
        board.collaborators.push({
            user: userToInvite._id,
            role: role || "editor",
        });
    }

    const updatedBoard = await board.save();

    res.status(200).json(updatedBoard);
};

module.exports = {
    createBoard,
    getBoards,
    getBoardById,
    updateBoard,
    deleteBoard,
    inviteCollaborator,
};
