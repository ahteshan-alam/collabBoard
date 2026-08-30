import { io } from "socket.io-client";

// One shared Socket.IO connection for the whole app. Unlike axios (which
// opens a new short-lived connection per request), Socket.IO keeps ONE
// connection open the whole time we need it, and we reuse this same
// connection everywhere instead of creating a new one per component.
//
// "autoConnect: false" means the connection does NOT start the moment this
// file is imported - we connect explicitly once we know which board the
// user is viewing (see the Whiteboard page), and disconnect when they leave it.
const socket = io(import.meta.env.VITE_SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});

export default socket;
