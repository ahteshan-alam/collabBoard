// Displays one board as a card: its title, either when it was last updated
// (if it's yours) or who shared it with you, and the actions you're allowed
// to take. Share and Delete only ever show up for boards you own - the
// backend also enforces this (see boardController.js), this just avoids
// showing a button that would fail anyway.
function BoardCard({ board, isOwner, onOpen, onDelete, onShare }) {
    const lastUpdated = new Date(board.updatedAt).toLocaleDateString();

    return (
        <div className="bg-ink-900 border border-ink-700 rounded-lg p-5 flex flex-col justify-between">
            <div>
                <h3 className="font-display text-lg truncate">{board.title}</h3>
                <p className="text-fog text-sm mt-1">
                    {isOwner ? `Updated ${lastUpdated}` : `Shared by ${board.owner.name}`}
                </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
                <button
                    onClick={() => onOpen(board._id)}
                    className="flex-1 bg-accent hover:bg-accent-600 rounded-lg py-2 text-sm font-medium transition-colors"
                >
                    Open
                </button>

                {isOwner && (
                    <>
                        <button
                            onClick={() => onShare(board)}
                            className="bg-ink-800 hover:bg-ink-700 border border-ink-700 rounded-lg px-3 py-2 text-sm transition-colors"
                        >
                            Share
                        </button>
                        <button
                            onClick={() => onDelete(board._id)}
                            className="bg-ink-800 hover:bg-cursor-coral/20 hover:text-cursor-coral border border-ink-700 rounded-lg px-3 py-2 text-sm transition-colors"
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default BoardCard;
