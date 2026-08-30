// Creates a short, good-enough-for-this-project unique id for whiteboard
// elements. We don't need database-grade uniqueness here - just something
// that won't collide between elements created in the same browser session.
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

export default generateId;
