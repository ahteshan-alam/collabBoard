// A small reusable mark: three overlapping dots next to the wordmark. It's a
// nod to what this app actually does - multiple people's cursors, together on
// one board - and it's reused in both the Navbar and the auth screens.
function Logo({ textSize = "text-lg" }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                <span className="w-4 h-4 rounded-full bg-accent ring-2 ring-ink-900" />
                <span className="w-4 h-4 rounded-full bg-cursor-teal ring-2 ring-ink-900" />
                <span className="w-4 h-4 rounded-full bg-cursor-coral ring-2 ring-ink-900" />
            </div>
            <span className={`font-display font-medium ${textSize}`}>CollabBoard</span>
        </div>
    );
}

export default Logo;
