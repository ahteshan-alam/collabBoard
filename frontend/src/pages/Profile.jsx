import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";

function Profile() {
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="p-8 max-w-md">
                <h1 className="font-display text-2xl mb-4">Your profile</h1>
                <div className="bg-ink-900 border border-ink-700 rounded-lg p-6 space-y-4">
                    <div>
                        <p className="text-sm text-fog">Name</p>
                        <p>{currentUser.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-fog">Email</p>
                        <p>{currentUser.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
