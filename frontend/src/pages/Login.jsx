import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/AuthLayout";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (error) {
            const message = error.response?.data?.message || "Something went wrong. Please try again.";
            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <h2 className="font-display text-2xl">Log in</h2>
                    <p className="text-fog text-sm mt-1">Welcome back to your boards.</p>
                </div>

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
                    <label className="block text-sm text-fog mb-1.5">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 outline-none focus:border-accent transition-colors"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent hover:bg-accent-600 disabled:opacity-50 rounded-lg py-2.5 font-medium transition-colors"
                >
                    {isSubmitting ? "Logging in..." : "Log in"}
                </button>

                <p className="text-sm text-fog text-center">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="text-accent hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default Login;
