import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Logo from "./Logo";

function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <nav className="h-14 bg-ink-900 border-b border-ink-700 px-6 flex items-center justify-between">
            <Link to="/dashboard">
                <Logo />
            </Link>

            {currentUser && (
                <div className="flex items-center gap-4 text-sm">
                    <Link to="/profile" className="text-fog hover:text-mist transition-colors">
                        {currentUser.name}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="bg-ink-800 hover:bg-ink-700 border border-ink-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
