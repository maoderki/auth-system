const env = require("../config/env");

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.cookieName, refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/auth/refresh",
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(env.cookieName, {
    path: "/auth/refresh",
  });
}

module.exports = {
  setRefreshCookie,
  clearRefreshCookie,
};