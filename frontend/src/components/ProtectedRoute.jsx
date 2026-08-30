import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Wraps a page that should only be visible to logged-in users.
// Usage: <ProtectedRoute><Dashboard /></ProtectedRoute>
function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth();

    // Still checking whether a previous session's cookie is valid - avoid
    // flashing the login page before we actually know the answer.
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-fog">Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    return children;
}

export default ProtectedRoute;
