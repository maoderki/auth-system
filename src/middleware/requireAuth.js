const User = require("../models/User");
const Session = require("../models/Session");
const Codes = require("../constants/responseCodes");
const { fail } = require("../utils/response");
const { verifyAccessToken } = require("../utils/jwt");
const defaults = require("../config/defaults");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, Codes.AUTH_TOKEN_MISSING, 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return fail(res, Codes.AUTH_TOKEN_INVALID, 401);
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return fail(res, Codes.AUTH_TOKEN_INVALID, 401);
    }

    const session = await Session.findOne({
      _id: decoded.sid,
      userId: user._id,
      isActive: true,
    });

    if (!session) {
      return fail(res, Codes.AUTH_TOKEN_INVALID, 401);
    }

    if (
      session.accessTokenJti &&
      session.accessTokenJti !== decoded.jti
    ) {
      return fail(res, Codes.AUTH_TOKEN_INVALID, 401);
    }

    const now = new Date();

    const shouldUpdateLastSeen =
      !user.lastSeenAt ||
      now - user.lastSeenAt > defaults.lastSeenUpdateIntervalMs;

    if (shouldUpdateLastSeen) {
      user.lastSeenAt = now;
      session.lastSeenAt = now;

      await user.save();
      await session.save();
    }

    req.user = user;
    req.session = session;
    req.token = decoded;

    next();
  } catch (error) {
    return fail(res, Codes.AUTH_TOKEN_INVALID, 401);
  }
}

module.exports = requireAuth;