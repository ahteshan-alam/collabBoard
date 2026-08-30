import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// This finds the <div id="root"> from index.html and renders our whole React
// app inside it. Everything you see in the browser starts from here.
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
