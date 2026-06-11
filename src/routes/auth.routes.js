const express = require("express");

const authController = require("../controllers/auth.controller");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
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
  updateRolesSchema,
  updateUserSchema,
  updateUserStatusSchema,
  adminUpdatePasswordSchema,
} = require("../validations/auth.validation");

const router = express.Router();
router.use(authRateLimit);

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", loginRateLimit, validate(loginSchema), authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.get("/sessions", requireAuth, authController.sessions);
router.post("/logout-all", requireAuth, authController.logoutAll);
router.delete("/sessions/:id", requireAuth, authController.logoutSession);
router.post("/change-password", requireAuth, validate(changePasswordSchema), authController.changePassword);
router.get("/admin/users", requireAuth, requireRole("admin"), authController.listUsers);
router.patch("/admin/users/:id/roles", requireAuth, requireRole("admin"), validate(updateRolesSchema), authController.updateUserRoles);
router.patch("/admin/users/:id/status", requireAuth, requireRole("admin"), validate(updateUserStatusSchema), authController.updateUserStatus);
router.patch("/admin/users/:id/password", requireAuth, requireRole("admin"), validate(adminUpdatePasswordSchema), authController.adminUpdateUserPassword);
router.get("/admin/users/:id", requireAuth, requireRole("admin"), authController.getUser);
router.patch("/admin/users/:id", requireAuth, requireRole("admin"), validate(updateUserSchema), authController.updateUser);
router.patch("/me", requireAuth, validate(updateUserSchema), authController.updateProfile);

module.exports = router;