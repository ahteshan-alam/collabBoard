import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite's config file. The React plugin gives us JSX support and fast refresh
// (your component's UI updates instantly as you save, without losing state).
export default defineConfig({
    plugins: [react()],
});
