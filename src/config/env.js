require("dotenv").config();

const defaults = require("./defaults");

module.exports = {
  mongoUri: process.env.AUTH_MONGO_URI,

  accessSecret: process.env.AUTH_ACCESS_SECRET,
  refreshSecret: process.env.AUTH_REFRESH_SECRET,

  accessExpires: process.env.AUTH_ACCESS_EXPIRES || defaults.accessTokenExpires,
  refreshExpires: process.env.AUTH_REFRESH_EXPIRES || defaults.refreshTokenExpires,

  cookieName: process.env.AUTH_COOKIE_NAME || defaults.cookieName,
  cookieSecure: process.env.AUTH_COOKIE_SECURE === "true",
  cookieSameSite: process.env.AUTH_COOKIE_SAMESITE || defaults.cookieSameSite,

  allowRegistration: process.env.AUTH_ALLOW_REGISTRATION === "true",
  loginIdentifier: process.env.AUTH_LOGIN_IDENTIFIER || defaults.loginIdentifier,
};