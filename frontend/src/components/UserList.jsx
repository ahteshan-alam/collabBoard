// Shows everyone else currently viewing this board: a colored dot (matching
// their cursor color, so it's obvious which name belongs to which cursor)
// and their name. Doesn't include the current user - you don't need to see
// yourself in your own online-users list.
function UserList({ users }) {
    if (users.length === 0) {
        return null; // nothing to show if we're the only one here
    }

    return (
        <div className="fixed top-44 right-6 bg-ink-900 border border-ink-700 rounded-lg p-3 w-48 z-10">
            <p className="text-xs text-fog uppercase tracking-wide mb-2">Online now</p>
            <ul className="space-y-1.5">
                {users.map((user) => (
                    <li key={user.socketId} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: user.color }} />
                        <span className="truncate">{user.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;
