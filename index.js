const authRoutes = require("./src/routes/auth.routes");
const requireAuth = require("./src/middleware/requireAuth");
const requireRole = require("./src/middleware/requireRole");

module.exports = {
  router: authRoutes,
  requireAuth,
  requireRole,
};