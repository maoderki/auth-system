require("dotenv").config();

const defaults = require("./defaults");

module.exports = {
  mongoUri: process.env.AUTH_MONGO_URI,

  accessSecret: process.env.AUTH_ACCESS_SECRET,
  refreshSecret: process.env.AUTH_REFRESH_SECRET,

  accessExpires: process.env.AUTH_ACCESS_EXPIRES || defaults.accessTokenExpires,
  refreshExpires: process.env.AUTH_REFRESH_EXPIRES || defaults.refreshTokenExpires,

  cookieName: process.env.AUTH_COOKIE_NAME || defaults.cookieName,
  cookieSecure:
    process.env.AUTH_COOKIE_SECURE !== undefined
      ? process.env.AUTH_COOKIE_SECURE === "true"
      : defaults.cookieSecure,
  cookieSameSite: process.env.AUTH_COOKIE_SAMESITE || defaults.cookieSameSite,

  allowRegistration:
    process.env.AUTH_ALLOW_REGISTRATION !== undefined
      ? process.env.AUTH_ALLOW_REGISTRATION === "true"
      : defaults.allowRegistration,
  loginIdentifier: process.env.AUTH_LOGIN_IDENTIFIER || defaults.loginIdentifier,

  port: Number(process.env.AUTH_PORT) || defaults.port,
  host: process.env.AUTH_HOST || defaults.host,
  corsOrigin: process.env.AUTH_CORS_ORIGIN || defaults.corsOrigin,
  trustProxy:
    process.env.AUTH_TRUST_PROXY !== undefined
      ? process.env.AUTH_TRUST_PROXY === "true"
      : defaults.trustProxy,
};