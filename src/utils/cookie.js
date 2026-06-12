const env = require("../config/env");

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.cookieName, refreshToken, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000,
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