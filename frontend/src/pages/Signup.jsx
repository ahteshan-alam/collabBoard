import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/AuthLayout";

function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            await signup(name, email, password);
            navigate("/dashboard");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Something went wrong. Please try again.";

            setErrorMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <form
                onSubmit={handleSubmit}
                className="space-y-5 max-[479px]:space-y-4"
            >
                <div>
                    <h2 className="font-display text-2xl max-[479px]:text-xl">
                        Create your account
                    </h2>

                    <p className="text-fog text-sm mt-1">
                        Start your first board in a minute.
                    </p>
                </div>

                {errorMessage && (
                    <p className="bg-cursor-coral/10 text-cursor-coral text-sm rounded-lg px-3 py-2 border border-cursor-coral/30">
                        {errorMessage}
                    </p>
                )}

                <div>
                    <label className="block text-sm text-fog mb-1.5">
                        Name
                    </label>

                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 outline-none focus:border-accent transition-colors"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-fog mb-1.5">
                        Email
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 outline-none focus:border-accent transition-colors"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-fog mb-1.5">
                        Password
                    </label>

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
                    {isSubmitting ? "Creating account..." : "Sign up"}
                </button>

                <p className="text-sm text-fog text-center">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="text-accent hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default Signup;