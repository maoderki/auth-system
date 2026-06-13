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
  appName: process.env.AUTH_APP_NAME,
  appUrl: process.env.AUTH_APP_URL,
  frontendUrl: process.env.AUTH_FRONTEND_URL,
  appLogoUrl: process.env.AUTH_APP_LOGO_URL,
  emailVerificationEnabled:
    process.env.AUTH_EMAIL_VERIFICATION_ENABLED === "true",
  mailHost: process.env.AUTH_MAIL_HOST,
  mailPort: Number(process.env.AUTH_MAIL_PORT),
  mailSecure: process.env.AUTH_MAIL_SECURE === "true",
  mailUser: process.env.AUTH_MAIL_USER,
  mailPass: process.env.AUTH_MAIL_PASS,
  mailFromName: process.env.AUTH_MAIL_FROM_NAME,
  mailFromEmail: process.env.AUTH_MAIL_FROM_EMAIL,
  trustProxy:
    process.env.AUTH_TRUST_PROXY !== undefined
      ? process.env.AUTH_TRUST_PROXY === "true"
      : defaults.trustProxy,
};