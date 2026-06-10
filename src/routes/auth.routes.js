const express = require("express");
const authController = require("../controllers/auth.controller");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);
router.post("/refresh", authController.refresh);
router.get("/sessions", requireAuth, authController.sessions);
router.post("/logout-all", requireAuth, authController.logoutAll);
router.delete("/sessions/:id", requireAuth, authController.logoutSession);
router.post("/change-password", requireAuth, authController.changePassword);
module.exports = router;