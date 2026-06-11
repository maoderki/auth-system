const { z } = require("zod");

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/),

  email: z
    .string()
    .email()
    .max(120),

  phone: z
    .string()
    .max(30)
    .optional()
    .nullable(),

  password: z
    .string()
    .min(8)
    .max(128),
});

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3)
    .max(120),

  password: z
    .string()
    .min(8)
    .max(128),

  deviceId: z
    .string()
    .min(3)
    .max(120),

  deviceName: z
    .string()
    .max(120)
    .optional()
    .nullable(),
});

const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(20)
    .optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(8)
    .max(128),

  newPassword: z
    .string()
    .min(8)
    .max(128),
});

const updateRolesSchema = z.object({
  roles: z
    .array(
      z.string()
        .trim()
        .min(1)
        .max(50)
        .regex(/^[a-zA-Z0-9._-]+$/)
    )
    .min(1)
    .max(10),
});

const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/).optional(),
  email: z.string().trim().email().max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

const adminUpdatePasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateRolesSchema,
  updateUserSchema,
  updateUserStatusSchema,
  adminUpdatePasswordSchema,
};