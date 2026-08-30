import { useState } from "react";

// A simple centered modal for inviting a collaborator to a board by email.
// onInvite is expected to be an async function - if it throws, we show the
// error message instead of closing the modal.
function ShareBoardModal({ board, onClose, onInvite }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("editor");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            await onInvite(board._id, email, role);
            onClose();
        } catch (error) {
            const message = error.response?.data?.message || "Could not send the invite. Please try again.";
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 w-full max-w-sm">
                <h2 className="font-display text-xl mb-1">Share &quot;{board.title}&quot;</h2>
                <p className="text-fog text-sm mb-4">Invite someone by their account email.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                        <p className="bg-cursor-coral/10 text-cursor-coral text-sm rounded-lg px-3 py-2 border border-cursor-coral/30">
                            {errorMessage}
                        </p>
                    )}

                    <div>
                        <label className="block text-sm text-fog mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 outline-none focus:border-accent transition-colors"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-fog mb-1.5">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 outline-none focus:border-accent transition-colors"
                        >
                            <option value="editor">Editor - can draw and edit</option>
                            <option value="viewer">Viewer - can only view</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-ink-800 hover:bg-ink-700 border border-ink-700 rounded-lg py-2.5 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-accent hover:bg-accent-600 disabled:opacity-50 rounded-lg py-2.5 text-sm font-medium transition-colors"
                        >
                            {isSubmitting ? "Inviting..." : "Invite"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ShareBoardModal;
