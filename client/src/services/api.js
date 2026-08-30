import axios from "axios";

// One shared axios instance for the whole app, already pointed at our backend
// and configured to send/receive cookies. "withCredentials: true" is required
// for our httpOnly JWT cookie to actually be sent with each request - without
// it, the browser won't attach the cookie even though it's stored.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

export default api;
