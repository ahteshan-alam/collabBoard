# CollabBoard - Manual Testing Checklist

Everything below needs to be run by hand in a real browser - this project was built without
the ability to actually execute `npm install` or start the servers, so nothing here has been
run end-to-end yet. Treat this as the definitive list before considering the project "done."

Where a step needs two users, use your two test accounts (e.g. `test@example.com` and
`test2@example.com`) in two separate browser windows (a normal window + an incognito window
works well, since they keep separate cookies).

## Setup

- [ ] `cd server && npm install && npm run dev` - starts on port 5000
- [ ] `cd client && npm install && npm run dev` - starts on port 5173
- [ ] Both `.env` files filled in from their `.env.example` (not just the example files -
      the real `.env` needs to exist too)

## Auth

- [ ] Signup with a new email works and redirects to the dashboard
- [ ] Signup with an already-registered email shows an error, doesn't create a duplicate
- [ ] Login with correct credentials works
- [ ] Login with a wrong password shows "Invalid email or password" (not a stack trace)
- [ ] Logout returns you to the login page
- [ ] Visiting `/dashboard` directly while logged out redirects to `/login`
- [ ] Refreshing the page while logged in keeps you logged in (doesn't bounce to login)

## Boards (Dashboard)

- [ ] Create board → immediately opens the new board
- [ ] Newly created board appears under "Created by you" back on the dashboard
- [ ] Share a board with a second account → it appears under "Shared with you" for them
- [ ] Delete a board you own → disappears from the list immediately
- [ ] A non-owner never sees Share/Delete buttons on a board, only Open

## Whiteboard - drawing tools

- [ ] Freehand (Pen) draws a smooth line following the cursor
- [ ] Line draws a single straight segment, not a curve
- [ ] Rectangle works dragging in all four directions (including "backwards")
- [ ] Circle grows outward from the click point as you drag
- [ ] Text: click, type in the prompt, text appears at that point; cancelling places nothing
- [ ] Eraser removes a shape when clicked directly on it
- [ ] Changing color affects new shapes only, not ones already drawn
- [ ] Changing stroke width visibly changes new shapes' thickness
- [ ] Clear canvas (with confirmation) empties the board
- [ ] Save, then refresh the page → drawing persists (loaded from the database)

## Real-time collaboration

- [ ] Two windows on the same board: drawing in one appears in the other within a moment
- [ ] Works for every tool, not just freehand
- [ ] Eraser and Clear canvas also sync to the other window
- [ ] Drawing in both windows AT THE SAME TIME doesn't cause either window's stroke to jump
      to the other window's cursor (this was a specific bug fixed in Phase 11 - worth
      double-checking)
- [ ] Live cursors: moving your mouse shows a colored dot + your name on the other window
- [ ] A user's cursor disappears from other windows within a moment of them leaving the
      board (both via in-app navigation AND by closing the tab entirely - these are two
      different code paths, both need checking)
- [ ] Online-users panel shows everyone currently on the board, including people who joined
      before you did
- [ ] "X joined the board" / "X left the board" notifications appear and self-dismiss after
      a few seconds

## Undo / Redo

- [ ] Undo removes the most recently drawn shape, one shape at a time
- [ ] A multi-point freehand stroke is undone as ONE action, not point by point
- [ ] Redo restores what Undo removed
- [ ] Drawing something new after an Undo disables Redo (the old redo branch is discarded)
- [ ] Ctrl+Z / Ctrl+Y (or Cmd+Z / Cmd+Y on Mac) work as shortcuts
- [ ] Undo/Redo buttons visibly disable when there's nothing left to undo/redo
- [ ] Undoing on one window updates the OTHER window's canvas too

## Permissions

- [ ] Invite someone as **Viewer**: they see a "you're viewing this board" message instead
      of the toolbar, no Save button, and clicking/dragging on the canvas does nothing
- [ ] A viewer directly calling `PUT /api/boards/:id` via curl/Postman gets a 403 - this is
      the REAL enforcement, not just a hidden button
- [ ] Invite someone as **Editor**: they get the full toolbar and can draw and save
- [ ] An editor trying to rename the board (via the API - there's no rename UI yet) gets a
      403; only the owner can rename
- [ ] The owner retains full access to everything: draw, save, rename, delete, invite

## Export

- [ ] Export PNG downloads an image matching exactly what's on the canvas
- [ ] Export JSON downloads a file with `{ title, elements }` matching the current board
- [ ] Both export buttons work for a viewer, not just the owner/editor
- [ ] Exporting an empty board doesn't error (blank PNG, `elements: []` in the JSON)

## Error handling (section 17 of the spec)

- [ ] Invalid board id in the URL (e.g. `/board/not-a-real-id`) shows a clean error message,
      not a crash
- [ ] Opening a board you don't have access to shows "You do not have access to this board"
- [ ] Stopping the backend and trying to load/save a board fails with a message, not a
      frozen UI
- [ ] Submitting the login/signup forms with empty fields is caught before it even reaches
      the server (the `required` attribute on the inputs)

## If something fails

Note exactly which checklist item failed, what you expected vs. what happened, and any
error message from the browser console or the backend terminal - that's everything needed
to track down the fix quickly.
