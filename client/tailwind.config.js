/** @type {import('tailwindcss').Config} */
export default {
    // Tailwind scans these files for class names like "bg-ink-900" and only
    // generates CSS for the classes we actually use, keeping the CSS bundle small.
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                ink: {
                    950: "#0A0C11", // page background
                    900: "#12151C", // card / raised surface
                    800: "#1B1F2A", // input / hover surface
                    700: "#2A2F3D", // borders
                },
                fog: "#8A8FA3", // secondary text
                mist: "#E7E9F0", // primary text
                accent: {
                    DEFAULT: "#7C6CF6", // primary buttons, links, focus rings
                    600: "#6753E8", // hover state
                },
                // Reserved for collaborator cursors and presence indicators (Phase 12+),
                // so every user on a board gets a visually distinct, consistent color.
                "cursor-teal": "#4FBF9B",
                "cursor-coral": "#E8795A",
                "cursor-amber": "#E8B84B",
            },
            fontFamily: {
                // Space Grotesk for headings/wordmark, Inter for everything else (forms, body text).
                display: ['"Space Grotesk"', "sans-serif"],
                sans: ["Inter", "sans-serif"],
            },
        },
    },
    plugins: [],
};
