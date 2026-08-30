// This is the entry point of the backend. Running "node server.js" (or "npm run dev")
// starts everything from here.

// dotenv.config() reads the .env file and loads values like MONGO_URI and JWT_SECRET
// into process.env, so we can use them anywhere in the backend.
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Connect to MongoDB. This runs once when the server starts.
connectDB();

const app = express();

// Express's "app" alone can only handle regular HTTP requests. Wrapping it in
// Node's own http server lets Socket.IO attach to that SAME server, so REST
// requests and the WebSocket connection share one server and one port
// instead of needing two separate servers.
const httpServer = http.createServer(app);

// Socket.IO needs the same CORS settings as our REST API, for the same
// reason: the browser (port 5173) and the server (port 5000) are different
// origins.
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

require("./socket/socketHandler")(io);

// ----- Middleware -----
// Middleware are functions that run on every request before it reaches our routes.

// Lets us read JSON data sent in a request body (e.g. req.body.email in a login request).
app.use(express.json());

// Lets us read cookies sent by the browser (e.g. the JWT cookie set on login).
app.use(cookieParser());

// By default, a browser blocks a React app on one port (5173) from calling an API on
// another port (5000). CORS explicitly allows it. "credentials: true" is required so the
// browser is allowed to send our httpOnly cookie along with the request.
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// ----- Routes -----
// A simple route to check that the server is running and reachable.
// Try it at http://localhost:5000/api/health once the server is started.
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "CollabBoard server is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/boards", require("./routes/boardRoutes"));

// These two must be registered LAST, after every other app.use() and route,
// since Express checks routes/middleware in the order they were added.
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
