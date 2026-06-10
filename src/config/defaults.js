module.exports = {
  accessTokenExpires: "15m",
  refreshTokenExpires: "30d",
  cookieName: "auth_refresh",

  allowRegistration: true,
  loginIdentifier: "email",

  password: {
    minLength: 8,
  },

  onlineThresholdMinutes: 5,
};