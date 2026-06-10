const Codes = require("../constants/responseCodes");
const { fail } = require("../utils/response");

function requireRole(...requiredRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return fail(res, Codes.AUTH_TOKEN_MISSING, 401);
    }

    const userRoles = req.user.roles || [];

    const hasRole = requiredRoles.some(role =>
      userRoles.includes(role)
    );

    if (!hasRole) {
      return fail(res, Codes.AUTH_ROLE_REQUIRED, 403);
    }

    next();
  };
}

module.exports = requireRole;