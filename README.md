# CollabBoard

A real-time collaborative whiteboard (a simplified FigJam / Miro / Excalidraw), built with
the MERN stack + Socket.IO. Built as a learning project — the code favors simplicity and
readability over cleverness, so it's easy to study, modify, and explain in interviews.

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS, React Router, Axios, Konva.js
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Real-time:** Socket.IO
- **Auth:** JWT + bcrypt, stored in an httpOnly cookie

## Project structure

```
CollabBoard/
├── client/     React frontend (Vite)
└── server/     Express backend + Socket.IO
```

## Running it locally

You'll need Node.js installed and a MongoDB connection string (a free MongoDB Atlas
cluster works fine).

### 1. Backend

```
cd server
npm install
cp .env.example .env
# open .env and fill in MONGO_URI and JWT_SECRET
npm run dev
```

The server starts on `http://localhost:5000`.

### 2. Frontend

In a second terminal:

```
cd client
npm install
cp .env.example .env
npm run dev
```

The app opens on `http://localhost:5173`.

## Build progress

See [TESTING.md](./TESTING.md) for the full manual testing checklist.

This project is being built in phases so each piece is understood before moving to the
next, rather than as one large code dump. See the chat where this was built for the
architecture explanation behind each phase.

- [x] Phase 1 — Project setup
- [x] Phase 2 — Backend setup (Express server + MongoDB connection)
- [x] Phase 3 — MongoDB models (User, Board)
- [x] Phase 4 — Authentication (signup, login, logout, protected routes, profile)
- [x] Phase 5 — Board APIs (create, list, view, update, delete, invite)
- [x] Phase 6 — React frontend (routing, auth context, Login/Signup, protected routes)
- [x] Phase 7 — Dashboard (board list, create, open, share, delete)
- [x] Phase 8 — Konva whiteboard (Stage/Layer setup, freehand drawing, save)
- [x] Phase 9 — Drawing tools (line, rectangle, circle, text, eraser, color, stroke width, clear)
- [x] Phase 10 — Socket.IO connection (server + client wired up, join/leave board rooms)
- [x] Phase 11 — Real-time drawing sync (draw/update/delete/clear broadcast live via Socket.IO)
- [x] Phase 12 — Live cursors (position + name broadcast, colored per user, cleaned up on leave)
- [x] Phase 13 — Online users (presence panel, join/leave notifications)
- [x] Phase 14 — Undo/redo (snapshot-based history, per-user, synced to others)
- [x] Phase 15 — Permissions (owner/editor/viewer roles, enforced server-side)
- [x] Phase 16 — Export (PNG via Konva toDataURL, JSON via Blob download)
- [x] Phase 17 — Testing and debugging (full code audit + TESTING.md checklist)
- [ ] Phase 18 — Final integration
