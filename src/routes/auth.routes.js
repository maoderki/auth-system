const express = require("express");

const authController = require("../controllers/auth.controller");
const requireAuth = require("../middleware/requireAuth");
const validate = require("../middleware/validate");
const {
  authRateLimit,
  loginRateLimit,
} = require("../middleware/rateLimit");

const {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} = require("../validations/auth.validation");

const router = express.Router();
router.use(authRateLimit);

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  loginRateLimit,
  validate(loginSchema),
  authController.login
);

router.get(
  "/me",
  requireAuth,
  authController.me
);

router.post(
  "/logout",
  requireAuth,
  authController.logout
);

router.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh
);

router.get(
  "/sessions",
  requireAuth,
  authController.sessions
);

router.post(
  "/logout-all",
  requireAuth,
  authController.logoutAll
);

router.delete(
  "/sessions/:id",
  requireAuth,
  authController.logoutSession
);

router.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;