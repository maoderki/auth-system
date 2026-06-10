const rateLimit = require("express-rate-limit");

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    errors: [],
  },
});

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "AUTH_LOGIN_RATE_LIMIT_EXCEEDED",
    errors: [],
  },
});

module.exports = {
  authRateLimit,
  loginRateLimit,
};