import Logo from "./Logo";

// Shared shell for the Login and Signup pages: a brand panel on the left
// (hidden on small screens) and the form itself on the right. Keeping this in
// one place means Login.jsx and Signup.jsx only have to think about their form.
function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-ink-900 border-r border-ink-700">
                <Logo textSize="text-xl" />

                <div>
                    <h1 className="font-display text-4xl leading-tight">
                        Draw together, in real time.
                    </h1>
                    <p className="text-fog mt-3 max-w-sm">
                        Every stroke, cursor, and idea syncs the instant it happens.
                    </p>
                </div>

                <p className="text-xs text-fog">CollabBoard &middot; a MERN + Socket.IO project</p>
            </div>

            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-8">
                        <Logo />
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;
