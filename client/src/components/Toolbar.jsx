// Tool buttons, color picker, stroke width, and a clear-canvas button -
// everything needed to control what gets drawn. This is a "controlled"
// component: it doesn't hold any state itself, it just shows whatever the
// Whiteboard page passes in and calls back up when something is clicked.
function Toolbar({
    selectedTool,
    onSelectTool,
    selectedColor,
    onSelectColor,
    strokeWidth,
    onSelectStrokeWidth,
    canUndo,
    onUndo,
    canRedo,
    onRedo,
    onClearCanvas,
}) {
    const tools = [
        { id: "freehand", label: "Pen" },
        { id: "line", label: "Line" },
        { id: "rectangle", label: "Rectangle" },
        { id: "circle", label: "Circle" },
        { id: "text", label: "Text" },
        { id: "eraser", label: "Eraser" },
    ];

    const colors = ["#E7E9F0", "#7C6CF6", "#4FBF9B", "#E8795A", "#E8B84B"];
    const strokeWidths = [2, 4, 8];

    return (
        <div className="h-14 border-b border-ink-700 px-6 flex items-center gap-6 overflow-x-auto">
            <div className="flex items-center gap-1">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                            selectedTool === tool.id
                                ? "bg-accent text-white"
                                : "bg-ink-800 hover:bg-ink-700 border border-ink-700"
                        }`}
                    >
                        {tool.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                {colors.map((color) => (
                    <button
                        key={color}
                        onClick={() => onSelectColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full border-2 transition-colors ${
                            selectedColor === color ? "border-mist" : "border-transparent"
                        }`}
                    />
                ))}
            </div>

            <div className="flex items-center gap-2">
                {strokeWidths.map((width) => (
                    <button
                        key={width}
                        onClick={() => onSelectStrokeWidth(width)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            strokeWidth === width
                                ? "bg-accent"
                                : "bg-ink-800 hover:bg-ink-700 border border-ink-700"
                        }`}
                    >
                        <span
                            className="rounded-full bg-mist"
                            style={{ width: `${width}px`, height: `${width}px` }}
                        />
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="bg-ink-800 hover:bg-ink-700 disabled:opacity-40 disabled:hover:bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
                >
                    Undo
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="bg-ink-800 hover:bg-ink-700 disabled:opacity-40 disabled:hover:bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
                >
                    Redo
                </button>
            </div>

            <button
                onClick={onClearCanvas}
                className="ml-auto bg-ink-800 hover:bg-cursor-coral/20 hover:text-cursor-coral border border-ink-700 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
            >
                Clear canvas
            </button>
        </div>
    );
}

export default Toolbar;
