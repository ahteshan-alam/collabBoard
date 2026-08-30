// Renders one other user's cursor: a small dot plus their name, positioned
// at their last known (x, y) on the canvas. Whiteboard.jsx renders one of
// these per connected user - this component itself just displays a position,
// it doesn't know anything about Socket.IO.
function Cursor({ x, y, name, color }) {
    return (
        <div
            className="absolute top-0 left-0 pointer-events-none flex items-center gap-1.5"
            style={{ transform: `translate(${x}px, ${y}px)` }}
        >
            <span className="w-3 h-3 rounded-full border-2 border-ink-950" style={{ backgroundColor: color }} />
            <span
                className="px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
                style={{ backgroundColor: color }}
            >
                {name}
            </span>
        </div>
    );
}

export default Cursor;
