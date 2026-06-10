require("dotenv").config();

module.exports = {
  mongoUri: process.env.AUTH_MONGO_URI,
loginIdentifier: process.env.AUTH_LOGIN_IDENTIFIER || "email",
  accessSecret: process.env.AUTH_ACCESS_SECRET,
  refreshSecret: process.env.AUTH_REFRESH_SECRET,

  accessExpires: process.env.AUTH_ACCESS_EXPIRES,
  refreshExpires: process.env.AUTH_REFRESH_EXPIRES,

  cookieName: process.env.AUTH_COOKIE_NAME,

  allowRegistration:
    process.env.AUTH_ALLOW_REGISTRATION === "true",
};