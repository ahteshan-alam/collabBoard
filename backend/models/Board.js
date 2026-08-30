// This file defines the "shape" of a Board document in MongoDB.
// A board stores its title, who owns it, who else can access it, and every
// shape that has been drawn on it.

const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            default: "Untitled Board",
        },

        // The user who created the board. This is an ObjectId that "references"
        // a document in the User collection - similar to a foreign key in SQL.
        // We can later call Board.findById(id).populate("owner") to get the
        // full user details instead of just their id.
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Other users who have access to this board, and what they're allowed
        // to do. The owner is NOT repeated here - they already have full access
        // through the "owner" field above. See Phase 15 (permissions) for how
        // these roles are checked.
        collaborators: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                role: {
                    type: String,
                    enum: ["editor", "viewer"], // only these two values are allowed
                    default: "editor",
                },
            },
        ],

        // Every shape drawn on the whiteboard (rectangles, circles, freehand
        // lines, text, etc). Each element is a plain object like:
        // { id: "abc123", type: "rectangle", x: 100, y: 200, width: 80, height: 40, color: "#000000" }
        //
        // Different tools produce objects with different fields (a line has
        // "points", a rectangle has "width"/"height"), so instead of forcing
        // every element into one rigid sub-schema, we store them as a flexible
        // array and let the frontend decide the exact shape of each object.
        elements: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

module.exports = mongoose.model("Board", boardSchema);
