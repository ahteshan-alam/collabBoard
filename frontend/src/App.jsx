import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Whiteboard from "./pages/Whiteboard";
import Profile from "./pages/Profile";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/board/:id"
                        element={
                            <ProtectedRoute>
                                <Whiteboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Any unknown path (including "/") redirects to the dashboard,
                        which will bounce to /login by itself if the user isn't logged in. */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
