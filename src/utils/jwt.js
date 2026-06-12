const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const defaults = require("../config/defaults");

function createJti() {
  return crypto.randomUUID();
}

function signAccessToken(user, sessionId, jti = createJti()) {
  const payload = {
    sub: user._id.toString(),
    sid: sessionId.toString(),
    jti,
    roles: user.roles || [],
    permissions: user.permissions || [],
    tokenVersion: user.tokenVersion || 0,
  };

  const token = jwt.sign(payload, env.accessSecret, {
    expiresIn: env.accessExpires || defaults.accessTokenExpires,
    algorithm: "HS256",
  });

  return { token, jti };
}

function signRefreshToken(user, sessionId) {
  const payload = {
    sub: user._id.toString(),
    sid: sessionId.toString(),
    type: "refresh",
    tokenVersion: user.tokenVersion || 0,
  };

  return jwt.sign(payload, env.refreshSecret, {
    expiresIn: env.refreshExpires || defaults.refreshTokenExpires,
    algorithm: "HS256",
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret, {
    algorithms: ["HS256"],
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret, {
    algorithms: ["HS256"],
  });
}

module.exports = {
  createJti,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};