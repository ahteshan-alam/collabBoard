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
        <nav className="h-14 bg-ink-900 border-b border-ink-700 px-6 flex items-center justify-between max-[767px]:px-4">
            <Link to="/dashboard">
                <Logo />
            </Link>

            {currentUser && (
                <div className="flex items-center gap-4 text-sm max-[479px]:gap-2 max-[479px]:text-xs">
                    <Link
                        to="/profile"
                        className="text-fog hover:text-mist transition-colors truncate max-[479px]:max-w-[100px]"
                    >
                        {currentUser.name}
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="bg-ink-800 hover:bg-ink-700 border border-ink-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap max-[479px]:px-2 max-[479px]:py-1"
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}

export default Navbar;