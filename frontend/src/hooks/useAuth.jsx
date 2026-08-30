import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

// React Context lets us share data (like "who is logged in") with any
// component in the app, without manually passing it down as props through
// every component in between ("prop drilling"). We reach for it here because
// the logged-in user is needed in many unrelated places at once: the Navbar,
// every protected page, and the login/signup forms.

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);

    // True while we're checking if the user is already logged in from a
    // previous session's cookie. This stops us from flashing the login page
    // for a split second before we actually know the answer.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkIfLoggedIn();
    }, []);

    // Runs once when the app first loads. The httpOnly cookie from a previous
    // login (if any) is sent automatically by the browser, so if it's still
    // valid, this tells us who's logged in without asking for a password again.
    const checkIfLoggedIn = async () => {
        try {
            const response = await api.get("/users/profile");
            setCurrentUser(response.data);
        } catch (error) {
            // No valid cookie, or it expired - that's fine, just stay logged out.
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post("/auth/login", { email, password });
        setCurrentUser(response.data);
    };

    const signup = async (name, email, password) => {
        const response = await api.post("/auth/signup", { name, email, password });
        setCurrentUser(response.data);
    };

    const logout = async () => {
        await api.post("/auth/logout");
        setCurrentUser(null);
    };

    const value = { currentUser, loading, login, signup, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A small custom hook so other components can write "const { currentUser } = useAuth()"
// instead of importing useContext and AuthContext everywhere they need it.
export function useAuth() {
    return useContext(AuthContext);
}
