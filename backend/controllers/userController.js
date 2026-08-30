// GET /api/users/profile
// This route is protected by the "protect" middleware (see routes/userRoutes.js),
// so by the time this function runs, req.user is already set to the logged-in
// user. This is also how the frontend checks "is someone already logged in?"
// when the app first loads - the httpOnly cookie from a previous session gets
// sent automatically, and this route confirms whether it's still valid.
const getProfile = async (req, res) => {
    res.status(200).json(req.user);
};

module.exports = { getProfile };
