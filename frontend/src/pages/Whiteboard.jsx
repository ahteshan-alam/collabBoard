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

    const [otherCursors, setOtherCursors] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const [selectedTool, setSelectedTool] = useState("freehand");
    const [selectedColor, setSelectedColor] = useState("#E7E9F0");
    const [strokeWidth, setStrokeWidth] = useState(4);

    const stageRef = useRef(null);

    useEffect(() => {
        getBoard();
    }, [id]);

    const showNotification = (message) => {
        const notificationId = Date.now();

        setNotifications((previousNotifications) => [
            ...previousNotifications,
            { id: notificationId, message },
        ]);

        setTimeout(() => {
            setNotifications((previousNotifications) =>
                previousNotifications.filter(
                    (notification) =>
                        notification.id !== notificationId
                )
            );
        }, 4000);
    };

    useEffect(() => {
        socket.connect();
        socket.emit("join-board", {
            boardId: id,
            name: currentUser.name,
        });

        socket.on("draw-element", ({ element }) => {
            setElements((previousElements) => [
                ...previousElements,
                element,
            ]);
        });

        socket.on("update-element", ({ element }) => {
            setElements((previousElements) =>
                previousElements.map((existingElement) =>
                    existingElement.id === element.id
                        ? element
                        : existingElement
                )
            );
        });

        socket.on("delete-element", ({ elementId }) => {
            setElements((previousElements) =>
                previousElements.filter(
                    (existingElement) =>
                        existingElement.id !== elementId
                )
            );
        });

        socket.on("clear-board", () => {
            setElements([]);
        });

        socket.on("sync-elements", ({ elements: newElements }) => {
            setElements(newElements);
        });

        socket.on("cursor-move", ({ socketId, x, y, name }) => {
            setOtherCursors((previousCursors) => ({
                ...previousCursors,
                [socketId]: { x, y, name },
            }));
        });

        socket.on("cursor-leave", ({ socketId }) => {
            setOtherCursors((previousCursors) => {
                const updatedCursors = { ...previousCursors };
                delete updatedCursors[socketId];
                return updatedCursors;
            });
        });

        socket.on("online-users", (users) => {
            setOnlineUsers(users);
        });

        socket.on("user-joined", ({ socketId, name }) => {
            setOnlineUsers((previousUsers) => [
                ...previousUsers,
                { socketId, name },
            ]);

            showNotification(`${name} joined the board`);
        });

        socket.on("user-left", ({ socketId, name }) => {
            setOnlineUsers((previousUsers) =>
                previousUsers.filter(
                    (user) => user.socketId !== socketId
                )
            );

            if (name) {
                showNotification(`${name} left the board`);
            }
        });

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
            const message =
                error.response?.data?.message ||
                "Could not load this board.";

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

    const pushHistory = () => {
        setHistory((previousHistory) => [
            ...previousHistory,
            elements,
        ]);

        setRedoStack([]);
    };

    const handleDrawElement = (element) => {
        pushHistory();

        setElements((previousElements) => [
            ...previousElements,
            element,
        ]);

        socket.emit("draw-element", {
            boardId: id,
            element,
        });
    };

    const handleUpdateElement = (element) => {
        setElements((previousElements) =>
            previousElements.map((existingElement) =>
                existingElement.id === element.id
                    ? element
                    : existingElement
            )
        );

        socket.emit("update-element", {
            boardId: id,
            element,
        });
    };

    const handleDeleteElement = (elementId) => {
        pushHistory();

        setElements((previousElements) =>
            previousElements.filter(
                (existingElement) =>
                    existingElement.id !== elementId
            )
        );

        socket.emit("delete-element", {
            boardId: id,
            elementId,
        });
    };

    const clearCanvas = () => {
        const confirmed = window.confirm(
            "Clear the whole canvas? This can't be undone once you save."
        );

        if (confirmed) {
            pushHistory();
            setElements([]);
            socket.emit("clear-board", { boardId: id });
        }
    };

    const isViewer =
        board?.currentUserRole === "viewer";

    const handleCursorMove = (x, y) => {
        socket.emit("cursor-move", {
            boardId: id,
            x,
            y,
            name: currentUser.name,
        });
    };

    const exportAsPNG = () => {
        if (!stageRef.current) {
            return;
        }

        const dataUrl = stageRef.current.toDataURL({
            pixelRatio: 2,
        });

        const link = document.createElement("a");

        link.download = `${board.title || "board"}.png`;
        link.href = dataUrl;
        link.click();
    };

    const exportAsJSON = () => {
        const exportData = {
            title: board.title,
            elements,
        };

        const jsonString = JSON.stringify(
            exportData,
            null,
            2
        );

        const blob = new Blob(
            [jsonString],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.download =
            `${board.title || "board"}.json`;

        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
    };

    const undo = () => {
        if (history.length === 0) {
            return;
        }

        const previousElements =
            history[history.length - 1];

        setRedoStack((previousRedoStack) => [
            ...previousRedoStack,
            elements,
        ]);

        setHistory((previousHistory) =>
            previousHistory.slice(0, -1)
        );

        setElements(previousElements);

        socket.emit("sync-elements", {
            boardId: id,
            elements: previousElements,
        });
    };

    const redo = () => {
        if (redoStack.length === 0) {
            return;
        }

        const nextElements =
            redoStack[redoStack.length - 1];

        setHistory((previousHistory) => [
            ...previousHistory,
            elements,
        ]);

        setRedoStack((previousRedoStack) =>
            previousRedoStack.slice(0, -1)
        );

        setElements(nextElements);

        socket.emit("sync-elements", {
            boardId: id,
            elements: nextElements,
        });
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            const isCtrlOrCmd =
                e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd && e.key === "z") {
                e.preventDefault();
                undo();
            } else if (
                isCtrlOrCmd &&
                e.key === "y"
            ) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
    }, [elements, history, redoStack]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <p className="text-fog p-8">
                    Loading board...
                </p>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <p className="text-cursor-coral p-8">
                    {errorMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Existing desktop layout is unchanged.
                The max-* classes only apply on smaller screens. */}
            <div
                className="
                    h-14 border-b border-ink-700 px-6
                    flex items-center justify-between

                    max-[1023px]:px-4
                    max-[767px]:h-auto
                    max-[767px]:min-h-14
                    max-[767px]:py-2
                    max-[767px]:gap-2
                "
            >
                <h1
                    className="
                        font-display text-lg truncate

                        max-[767px]:max-w-[120px]
                    "
                >
                    {board.title}
                </h1>

                <div
                    className="
                        flex items-center gap-3

                        max-[1023px]:gap-2
                        max-[767px]:overflow-x-auto
                        max-[767px]:max-w-[75%]
                        max-[767px]:flex-nowrap
                    "
                >
                    <button
                        onClick={exportAsPNG}
                        className="
                            bg-ink-800 hover:bg-ink-700
                            border border-ink-700
                            rounded-lg px-3 py-2 text-sm
                            transition-colors
                            whitespace-nowrap

                            max-[767px]:px-2.5
                            max-[767px]:py-1.5
                            max-[767px]:text-xs
                        "
                    >
                        Export PNG
                    </button>

                    <button
                        onClick={exportAsJSON}
                        className="
                            bg-ink-800 hover:bg-ink-700
                            border border-ink-700
                            rounded-lg px-3 py-2 text-sm
                            transition-colors
                            whitespace-nowrap

                            max-[767px]:px-2.5
                            max-[767px]:py-1.5
                            max-[767px]:text-xs
                        "
                    >
                        Export JSON
                    </button>

                    {!isViewer && (
                        <>
                            {savedMessage && (
                                <span
                                    className="
                                        text-fog text-sm
                                        whitespace-nowrap
                                        max-[767px]:text-xs
                                    "
                                >
                                    {savedMessage}
                                </span>
                            )}

                            <button
                                onClick={saveBoard}
                                disabled={isSaving}
                                className="
                                    bg-accent
                                    hover:bg-accent-600
                                    disabled:opacity-50
                                    rounded-lg px-4 py-2
                                    text-sm font-medium
                                    transition-colors
                                    whitespace-nowrap

                                    max-[767px]:px-3
                                    max-[767px]:py-1.5
                                    max-[767px]:text-xs
                                "
                            >
                                {isSaving
                                    ? "Saving..."
                                    : "Save"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isViewer ? (
                <div
                    className="
                        h-14 border-b border-ink-700
                        px-6 flex items-center

                        max-[1023px]:px-4

                        max-[767px]:
                        h-auto min-h-14 py-2
                    "
                >
                    <p
                        className="
                            text-fog text-sm

                            max-[767px]:text-xs
                        "
                    >
                        You're viewing this board. Ask
                        the owner for edit access to draw.
                    </p>
                </div>
            ) : (
                <Toolbar
                    selectedTool={selectedTool}
                    onSelectTool={setSelectedTool}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
                    strokeWidth={strokeWidth}
                    onSelectStrokeWidth={
                        setStrokeWidth
                    }
                    canUndo={history.length > 0}
                    onUndo={undo}
                    canRedo={redoStack.length > 0}
                    onRedo={redo}
                    onClearCanvas={clearCanvas}
                />
            )}

            <div
                className="
                    relative
                    max-[767px]:overflow-hidden
                "
            >
                <Canvas
                    elements={elements}
                    onDrawElement={
                        handleDrawElement
                    }
                    onUpdateElement={
                        handleUpdateElement
                    }
                    onDeleteElement={
                        handleDeleteElement
                    }
                    onCursorMove={handleCursorMove}
                    selectedTool={selectedTool}
                    selectedColor={selectedColor}
                    strokeWidth={strokeWidth}
                    readOnly={isViewer}
                    stageRef={stageRef}
                />

                {Object.entries(otherCursors).map(
                    ([socketId, cursor]) => (
                        <Cursor
                            key={socketId}
                            x={cursor.x}
                            y={cursor.y}
                            name={cursor.name}
                            color={getCursorColor(
                                socketId
                            )}
                        />
                    )
                )}
            </div>

            <UserList
                users={onlineUsers.map((user) => ({
                    ...user,
                    color: getCursorColor(
                        user.socketId
                    ),
                }))}
            />

            {notifications.length > 0 && (
                <div
                    className="
                        fixed top-16 right-4
                        flex flex-col gap-2 z-50

                        max-[767px]:top-20
                        max-[767px]:right-2
                        max-[767px]:left-2
                    "
                >
                    {notifications.map(
                        (notification) => (
                            <div
                                key={notification.id}
                                className="
                                    bg-ink-900
                                    border border-ink-700
                                    rounded-lg px-3 py-2
                                    text-sm shadow-lg

                                    max-[767px]:text-xs
                                "
                            >
                                {notification.message}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default Whiteboard;