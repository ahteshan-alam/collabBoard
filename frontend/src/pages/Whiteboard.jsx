import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Toolbar from "../components/Toolbar";
import Canvas from "../components/Canvas";
import Cursor from "../components/Cursor";
import UserList from "../components/UserList";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import socket from "../services/socket";

// A small, fixed set of colors to assign to other users' cursors.
const cursorColors = ["#7C6CF6", "#4FBF9B", "#E8795A", "#E8B84B"];

// Turns a socket id into one of the colors above, always the SAME color for
// the same socket id. This means a user keeps a consistent cursor color for
// as long as they're connected, without us having to store color
// assignments anywhere - the id itself deterministically picks the color.
function getCursorColor(socketId) {
    let total = 0;
    for (let i = 0; i < socketId.length; i++) {
        total += socketId.charCodeAt(i);
    }
    return cursorColors[total % cursorColors.length];
}

function Whiteboard() {
    const { id } = useParams();
    const { currentUser } = useAuth();

    const [board, setBoard] = useState(null);
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState("");

    // Other users' live cursor positions, keyed by their socket id:
    // { [socketId]: { x, y, name } }. Our OWN cursor is never in here - we
    // only ever add entries from events broadcast by other people.
    const [otherCursors, setOtherCursors] = useState({});

    // Everyone else currently on this board: [{ socketId, name }]. Same idea
    // as otherCursors - never includes ourselves.
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Brief "so-and-so joined/left" messages, each removed automatically a
    // few seconds after it appears - see showNotification below.
    const [notifications, setNotifications] = useState([]);

    // Undo/redo history: "history" holds past snapshots of the WHOLE
    // elements array (not individual diffs - much simpler to reason about),
    // one snapshot per completed action. "redoStack" holds snapshots we've
    // undone, in case the user wants to redo them. See pushHistory, undo,
    // and redo below for how these are used.
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const [selectedTool, setSelectedTool] = useState("freehand");
    const [selectedColor, setSelectedColor] = useState("#E7E9F0");
    const [strokeWidth, setStrokeWidth] = useState(4);

    // A reference to the actual Konva Stage instance, handed down to Canvas
    // as a plain prop. This is what lets exportAsPNG (below) call
    // stage.toDataURL() directly, without Canvas needing to know anything
    // about exporting.
    const stageRef = useRef(null);

    // Loads whatever was last explicitly saved for this board. Note this
    // means a user joining mid-session sees the last SAVED state, not
    // necessarily what everyone currently on the board is looking at if they
    // haven't hit Save yet - real-time sync only covers changes made AFTER
    // you join. Handling that would mean the server keeping a live in-memory
    // copy of every open board, which is real added complexity we're
    // deliberately leaving out of this project.
    useEffect(() => {
        getBoard();
    }, [id]);

    // Adds a brief "so-and-so joined/left" message, then removes it again a
    // few seconds later so notifications don't pile up on screen forever.
    const showNotification = (message) => {
        const notificationId = Date.now();
        setNotifications((previousNotifications) => [...previousNotifications, { id: notificationId, message }]);

        setTimeout(() => {
            setNotifications((previousNotifications) =>
                previousNotifications.filter((notification) => notification.id !== notificationId)
            );
        }, 4000);
    };

    // Connects to the Socket.IO server, joins this board's room, and listens
    // for drawing events from other users. This is the real-time
    // collaboration itself: when someone else draws, updates, or erases a
    // shape, one of these listeners fires and we update our own "elements"
    // state to match - Konva re-renders automatically, exactly the same way
    // it does for our own drawing.
    useEffect(() => {
        socket.connect();
        socket.emit("join-board", { boardId: id, name: currentUser.name });

        socket.on("draw-element", ({ element }) => {
            setElements((previousElements) => [...previousElements, element]);
        });

        socket.on("update-element", ({ element }) => {
            setElements((previousElements) =>
                previousElements.map((existingElement) =>
                    existingElement.id === element.id ? element : existingElement
                )
            );
        });

        socket.on("delete-element", ({ elementId }) => {
            setElements((previousElements) =>
                previousElements.filter((existingElement) => existingElement.id !== elementId)
            );
        });

        socket.on("clear-board", () => {
            setElements([]);
        });

        // Someone else just undid or redid an action. We don't know or care
        // which - we just adopt the full elements array they ended up with,
        // the same way "clear-board" replaces our array wholesale.
        socket.on("sync-elements", ({ elements: newElements }) => {
            setElements(newElements);
        });

        socket.on("cursor-move", ({ socketId, x, y, name }) => {
            setOtherCursors((previousCursors) => ({
                ...previousCursors,
                [socketId]: { x, y, name },
            }));
        });

        // Fired by the server right before a user's socket disconnects (see
        // the "disconnecting" handler in socketHandler.js), so their cursor
        // doesn't stay frozen on our screen after they've actually left.
        socket.on("cursor-leave", ({ socketId }) => {
            setOtherCursors((previousCursors) => {
                const updatedCursors = { ...previousCursors };
                delete updatedCursors[socketId];
                return updatedCursors;
            });
        });

        // Sent to us just once, right after we join - the list of everyone
        // who was already on the board before we got here.
        socket.on("online-users", (users) => {
            setOnlineUsers(users);
        });

        socket.on("user-joined", ({ socketId, name }) => {
            setOnlineUsers((previousUsers) => [...previousUsers, { socketId, name }]);
            showNotification(`${name} joined the board`);
        });

        socket.on("user-left", ({ socketId, name }) => {
            setOnlineUsers((previousUsers) => previousUsers.filter((user) => user.socketId !== socketId));

            if (name) {
                showNotification(`${name} left the board`);
            }
        });

        // Runs on unmount, or right before this effect re-runs because "id"
        // changed. Leaving the room and removing our listeners keeps us from
        // reacting to events for a board we're no longer viewing. We also
        // clear otherCursors and onlineUsers so we don't carry stale data
        // from this board over to whichever board we look at next.
        return () => {
            socket.emit("leave-board", id);
            socket.off("draw-element");
            socket.off("update-element");
            socket.off("delete-element");
            socket.off("clear-board");
            socket.off("sync-elements");
            socket.off("cursor-move");
            socket.off("cursor-leave");
            socket.off("online-users");
            socket.off("user-joined");
            socket.off("user-left");
            socket.disconnect();
            setOtherCursors({});
            setOnlineUsers([]);
        };
    }, [id]);

    const getBoard = async () => {
        try {
            const response = await api.get(`/boards/${id}`);
            setBoard(response.data);
            setElements(response.data.elements);
        } catch (error) {
            const message = error.response?.data?.message || "Could not load this board.";
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    };

    const saveBoard = async () => {
        setIsSaving(true);
        setSavedMessage("");

        try {
            await api.put(`/boards/${id}`, { elements });
            setSavedMessage("Saved");
        } catch (error) {
            setSavedMessage("Could not save");
        } finally {
            setIsSaving(false);
        }
    };

    // Saves a snapshot of the CURRENT elements array (before a change is
    // applied) onto the undo history, and clears the redo stack - starting a
    // new action means any previously-undone future is no longer reachable.
    // Deliberately NOT called from handleUpdateElement: that fires
    // repeatedly while dragging out a single shape, and it's a continuation
    // of the action that handleDrawElement already snapshotted, not a new
    // one of its own.
    const pushHistory = () => {
        setHistory((previousHistory) => [...previousHistory, elements]);
        setRedoStack([]);
    };

    // These three are passed down to Canvas. Each one does three things:
    // records the undo snapshot, updates our OWN "elements" state (so our
    // screen reflects the change immediately, with no lag waiting on the
    // network), and emits the matching Socket.IO event (so every other
    // user's screen updates too, via the listeners registered above).
    const handleDrawElement = (element) => {
        pushHistory();
        setElements((previousElements) => [...previousElements, element]);
        socket.emit("draw-element", { boardId: id, element });
    };

    const handleUpdateElement = (element) => {
        setElements((previousElements) =>
            previousElements.map((existingElement) => (existingElement.id === element.id ? element : existingElement))
        );
        socket.emit("update-element", { boardId: id, element });
    };

    const handleDeleteElement = (elementId) => {
        pushHistory();
        setElements((previousElements) =>
            previousElements.filter((existingElement) => existingElement.id !== elementId)
        );
        socket.emit("delete-element", { boardId: id, elementId });
    };

    const clearCanvas = () => {
        const confirmed = window.confirm("Clear the whole canvas? This can't be undone once you save.");

        if (confirmed) {
            pushHistory();
            setElements([]);
            socket.emit("clear-board", { boardId: id });
        }
    };

    // The backend includes our OWN role on this board in its response (see
    // getBoardById in boardController.js) - "owner", "editor", or "viewer".
    // We trust it as the source of truth rather than re-deriving it
    // ourselves, since the server already knows for certain.
    const isViewer = board?.currentUserRole === "viewer";

    // Passed down to Canvas, which calls this on every mouse move over the
    // Stage. We don't touch our own state here - we only tell the server our
    // position, which relays it to everyone else (see "cursor-move" above).
    const handleCursorMove = (x, y) => {
        socket.emit("cursor-move", { boardId: id, x, y, name: currentUser.name });
    };

    // Renders the current canvas to a PNG and downloads it. toDataURL() is a
    // built-in Konva Stage method - it draws everything on the stage into an
    // image and hands back the result as a "data URL" (the image's bytes,
    // encoded directly into a string). "pixelRatio: 2" renders at double
    // resolution, so the export looks sharp rather than slightly blurry.
    const exportAsPNG = () => {
        if (!stageRef.current) {
            return;
        }

        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });

        // The standard trick for triggering a browser download from
        // JavaScript: create a link element that nobody ever sees, point it
        // at the data, and click it programmatically.
        const link = document.createElement("a");
        link.download = `${board.title || "board"}.png`;
        link.href = dataUrl;
        link.click();
    };

    // Downloads the raw elements data as a .json file - useful for backing
    // up a board or inspecting exactly what's stored for it.
    const exportAsJSON = () => {
        const exportData = { title: board.title, elements };
        const jsonString = JSON.stringify(exportData, null, 2);

        // A Blob is how the browser represents raw file-like data in memory.
        // createObjectURL() gives us a temporary URL that points at it, which
        // we can use as a download link the same way as the PNG above.
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.download = `${board.title || "board"}.json`;
        link.href = url;
        link.click();

        URL.revokeObjectURL(url); // free the temporary URL now that we're done with it
    };

    const undo = () => {
        if (history.length === 0) {
            return; // nothing to undo
        }

        const previousElements = history[history.length - 1];

        setRedoStack((previousRedoStack) => [...previousRedoStack, elements]);
        setHistory((previousHistory) => previousHistory.slice(0, -1));
        setElements(previousElements);
        socket.emit("sync-elements", { boardId: id, elements: previousElements });
    };

    const redo = () => {
        if (redoStack.length === 0) {
            return; // nothing to redo
        }

        const nextElements = redoStack[redoStack.length - 1];

        setHistory((previousHistory) => [...previousHistory, elements]);
        setRedoStack((previousRedoStack) => previousRedoStack.slice(0, -1));
        setElements(nextElements);
        socket.emit("sync-elements", { boardId: id, elements: nextElements });
    };

    // Ctrl+Z / Cmd+Z to undo, Ctrl+Y / Cmd+Y to redo. This effect re-attaches
    // its listener whenever elements/history/redoStack change, so undo() and
    // redo() always see the current values instead of stale ones from
    // whenever the listener was first added.
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd && e.key === "z") {
                e.preventDefault();
                undo();
            } else if (isCtrlOrCmd && e.key === "y") {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [elements, history, redoStack]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <p className="text-fog p-8">Loading board...</p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <p className="text-cursor-coral p-8">{errorMessage}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="h-14 border-b border-ink-700 px-6 flex items-center justify-between">
                <h1 className="font-display text-lg truncate">{board.title}</h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={exportAsPNG}
                        className="bg-ink-800 hover:bg-ink-700 border border-ink-700 rounded-lg px-3 py-2 text-sm transition-colors"
                    >
                        Export PNG
                    </button>
                    <button
                        onClick={exportAsJSON}
                        className="bg-ink-800 hover:bg-ink-700 border border-ink-700 rounded-lg px-3 py-2 text-sm transition-colors"
                    >
                        Export JSON
                    </button>

                    {/* Viewers can't save anything - the server would reject it anyway
                        (see the "viewer" check in updateBoard), so we don't even show the button. */}
                    {!isViewer && (
                        <>
                            {savedMessage && <span className="text-fog text-sm">{savedMessage}</span>}
                            <button
                                onClick={saveBoard}
                                disabled={isSaving}
                                className="bg-accent hover:bg-accent-600 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isViewer ? (
                <div className="h-14 border-b border-ink-700 px-6 flex items-center">
                    <p className="text-fog text-sm">
                        You're viewing this board. Ask the owner for edit access to draw.
                    </p>
                </div>
            ) : (
                <Toolbar
                    selectedTool={selectedTool}
                    onSelectTool={setSelectedTool}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
                    strokeWidth={strokeWidth}
                    onSelectStrokeWidth={setStrokeWidth}
                    canUndo={history.length > 0}
                    onUndo={undo}
                    canRedo={redoStack.length > 0}
                    onRedo={redo}
                    onClearCanvas={clearCanvas}
                />
            )}

            <div className="relative">
                <Canvas
                    elements={elements}
                    onDrawElement={handleDrawElement}
                    onUpdateElement={handleUpdateElement}
                    onDeleteElement={handleDeleteElement}
                    onCursorMove={handleCursorMove}
                    selectedTool={selectedTool}
                    selectedColor={selectedColor}
                    strokeWidth={strokeWidth}
                    readOnly={isViewer}
                    stageRef={stageRef}
                />

                {Object.entries(otherCursors).map(([socketId, cursor]) => (
                    <Cursor
                        key={socketId}
                        x={cursor.x}
                        y={cursor.y}
                        name={cursor.name}
                        color={getCursorColor(socketId)}
                    />
                ))}
            </div>

            <UserList
                users={onlineUsers.map((user) => ({ ...user, color: getCursorColor(user.socketId) }))}
            />

            {notifications.length > 0 && (
                <div className="fixed top-16 right-4 flex flex-col gap-2 z-50">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="bg-ink-900 border border-ink-700 rounded-lg px-3 py-2 text-sm shadow-lg"
                        >
                            {notification.message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Whiteboard;
