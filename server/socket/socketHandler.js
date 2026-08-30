// This file sets up everything that happens over the Socket.IO connection.
// server.js calls initializeSocket(io) once, when the server starts.
//
// Socket.IO rooms: a "room" is just a label a socket can join or leave. We
// use each board's MongoDB _id as the room name, so everyone viewing the
// same board ends up in the same room.
function initializeSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join-board", async ({ boardId, name }) => {
            socket.join(boardId);

            // socket.data is a plain object Socket.IO gives every connection
            // to store whatever we want on it, for as long as that socket
            // stays connected. We use it to remember this user's name, so we
            // can still refer to it later (in "disconnecting" below) without
            // the client having to send it again.
            socket.data.name = name;

            console.log(`Socket ${socket.id} (${name}) joined board ${boardId}`);

            // Tell everyone ELSE already in the room that a new user arrived.
            socket.to(boardId).emit("user-joined", { socketId: socket.id, name });

            // Send the list of everyone ALREADY in the room back to the
            // person who just joined, so their online-users list starts out
            // correct immediately, instead of empty until someone else
            // happens to draw or move their mouse.
            const socketsInRoom = await io.in(boardId).fetchSockets();
            const onlineUsers = socketsInRoom
                .filter((otherSocket) => otherSocket.id !== socket.id)
                .map((otherSocket) => ({ socketId: otherSocket.id, name: otherSocket.data.name }));

            socket.emit("online-users", onlineUsers);
        });

        socket.on("leave-board", (boardId) => {
            // We broadcast BEFORE calling socket.leave() - once we've left
            // the room, we can no longer send anything "to" it. This also
            // covers the normal, graceful way a user leaves a board (clicking
            // back to the dashboard), as opposed to the abrupt case (closing
            // the tab), which "disconnecting" below handles instead.
            socket.to(boardId).emit("user-left", { socketId: socket.id, name: socket.data.name });
            socket.to(boardId).emit("cursor-leave", { socketId: socket.id });

            socket.leave(boardId);
            console.log(`Socket ${socket.id} left board ${boardId}`);
        });

        // These four events are the heart of real-time collaboration, and
        // they all do the SAME thing: take whatever the sender sent, and
        // broadcast it to everyone else currently in that board's room.
        //
        // "socket.to(boardId)" (not "io.to(boardId)") sends to every OTHER
        // socket in the room, excluding the sender. The sender already
        // applied the change to their own screen directly - re-sending it
        // back to them would just create a duplicate.
        //
        // Notice the server never touches MongoDB here - broadcasting every
        // single stroke to the database would be far too frequent. The
        // database is only updated when a user explicitly clicks "Save"
        // (see the PUT /api/boards/:id route from Phase 5).
        socket.on("draw-element", ({ boardId, element }) => {
            socket.to(boardId).emit("draw-element", { element });
        });

        socket.on("update-element", ({ boardId, element }) => {
            socket.to(boardId).emit("update-element", { element });
        });

        socket.on("delete-element", ({ boardId, elementId }) => {
            socket.to(boardId).emit("delete-element", { elementId });
        });

        socket.on("clear-board", ({ boardId }) => {
            socket.to(boardId).emit("clear-board");
        });

        // Fired after a LOCAL undo or redo. We don't track anyone's undo
        // history on the server - each user only manages their own - but we
        // still broadcast the resulting elements array so everyone else's
        // board stays visually in sync with whatever the undo/redo produced.
        socket.on("sync-elements", ({ boardId, elements }) => {
            socket.to(boardId).emit("sync-elements", { elements });
        });

        // Broadcasts one user's mouse position to everyone else on the same
        // board, so their cursor (with their name) can be drawn on our
        // screen. This fires very often - once per mousemove - which is fine
        // for a project this size, but a busier app would typically throttle
        // it (e.g. sending at most every 50ms) to cut down on network traffic.
        socket.on("cursor-move", ({ boardId, x, y, name }) => {
            socket.to(boardId).emit("cursor-move", { socketId: socket.id, x, y, name });
        });

        // "disconnecting" (unlike "disconnect") fires just BEFORE a socket
        // actually leaves its rooms - so socket.rooms is still populated
        // here, which is what lets us tell everyone else in those rooms that
        // this user's cursor should be removed and that they've left.
        // socket.rooms always includes the socket's own private room (named
        // after its own id), so we skip that one - it's not a board room.
        //
        // This only fires for an ABRUPT disconnect (closing the tab, losing
        // the connection). A graceful leave already left the room and
        // broadcast these same two events in the "leave-board" handler
        // above, so socket.rooms won't contain that board anymore here -
        // meaning this loop naturally does nothing extra for boards the user
        // already left properly.
        socket.on("disconnecting", () => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.to(room).emit("cursor-leave", { socketId: socket.id });
                    socket.to(room).emit("user-left", { socketId: socket.id, name: socket.data.name });
                }
            });
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}

module.exports = initializeSocket;
