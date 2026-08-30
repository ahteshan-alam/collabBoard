import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BoardCard from "../components/BoardCard";
import ShareBoardModal from "../components/ShareBoardModal";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

function Dashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // The board currently open in the share modal, or null if it's closed.
    const [sharingBoard, setSharingBoard] = useState(null);

    useEffect(() => {
        getBoards();
    }, []);

    const getBoards = async () => {
        try {
            const response = await api.get("/boards");
            setBoards(response.data);
        } catch (error) {
            setErrorMessage("Could not load your boards. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };

    const createBoard = async () => {
        const title = window.prompt("Enter board name:");
    
        if (!title) {
            return;
        }
    
        setErrorMessage("");
        setIsCreating(true);
    
        try {
            const response = await api.post("/boards", { title });
    
            navigate(`/board/${response.data._id}`);
        } catch (error) {
            setErrorMessage("Could not create a new board. Please try again.");
        } finally {
            setIsCreating(false);
        }
    };

    const deleteBoard = async (boardId) => {
        const confirmed = window.confirm("Delete this board? This cannot be undone.");

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/boards/${boardId}`);
            setBoards(boards.filter((board) => board._id !== boardId));
        } catch (error) {
            setErrorMessage("Could not delete the board. Please try again.");
        }
    };

    const inviteCollaborator = async (boardId, email, role) => {
        await api.post(`/boards/${boardId}/invite`, { email, role });
        getBoards(); // refresh so the new collaborator shows up right away
    };

    const openBoard = (boardId) => {
        navigate(`/board/${boardId}`);
    };

    // "owner" comes back from the API populated with { _id, name, email }.
    // currentUser.id and board.owner._id are both plain strings by the time
    // they reach the browser, so a direct comparison works.
    const ownedBoards = boards.filter((board) => board.owner._id === currentUser._id);
    const sharedBoards = boards.filter((board) => board.owner._id !== currentUser._id);

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="p-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-display text-2xl">Your boards</h1>
                        <p className="text-fog text-sm mt-1">Welcome back, {currentUser.name}.</p>
                    </div>

                    <button
                        onClick={createBoard}
                        disabled={isCreating}
                        className="bg-accent hover:bg-accent-600 disabled:opacity-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                    >
                        {isCreating ? "Creating..." : "+ Create board"}
                    </button>
                </div>

                {errorMessage && (
                    <p className="bg-cursor-coral/10 text-cursor-coral text-sm rounded-lg px-3 py-2 border border-cursor-coral/30 mb-6">
                        {errorMessage}
                    </p>
                )}

                {loading ? (
                    <p className="text-fog">Loading your boards...</p>
                ) : (
                    <>
                        <section className="mb-10">
                            <h2 className="text-sm text-fog uppercase tracking-wide mb-3">Created by you</h2>

                            {ownedBoards.length === 0 ? (
                                <p className="text-fog text-sm">
                                    You don&apos;t have any boards yet. Create your first one above.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {ownedBoards.map((board) => (
                                        <BoardCard
                                            key={board._id}
                                            board={board}
                                            isOwner={true}
                                            onOpen={openBoard}
                                            onDelete={deleteBoard}
                                            onShare={setSharingBoard}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {sharedBoards.length > 0 && (
                            <section>
                                <h2 className="text-sm text-fog uppercase tracking-wide mb-3">Shared with you</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sharedBoards.map((board) => (
                                        <BoardCard key={board._id} board={board} isOwner={false} onOpen={openBoard} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>

            {sharingBoard && (
                <ShareBoardModal
                    board={sharingBoard}
                    onClose={() => setSharingBoard(null)}
                    onInvite={inviteCollaborator}
                />
            )}
        </div>
    );
}

export default Dashboard;
