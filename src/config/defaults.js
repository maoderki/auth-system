module.exports = {
  accessTokenExpires: "15m",
  refreshTokenExpires: "30d",

  cookieName: "auth_refresh",
  cookieSecure: false,
  cookieSameSite: "lax",

  allowRegistration: true,
  loginIdentifier: "email",

  password: {
    minLength: 8,
  },

  loginLock: {
    maxAttempts: 5,
    lockMinutes: 15,
  },

  onlineThresholdMinutes: 5,
};