const authService = require("../services/auth.service");
const Codes = require("../constants/responseCodes");
const { success, fail } = require("../utils/response");

async function register(req, res) {
  try {
    const user = await authService.register(req.body);

    return success(res, Codes.AUTH_REGISTER_SUCCESS, { user }, 201);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

async function login(req, res) {
  try {
    const result = await authService.login({
      identifier: req.body.identifier,
      password: req.body.password,
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    return success(res, Codes.AUTH_LOGIN_SUCCESS, result, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 401);
  }
}

async function me(req, res) {
  return success(res, Codes.AUTH_ME_SUCCESS, {
    user: authService.sanitizeUser(req.user),
    session: {
      id: req.session._id,
      deviceId: req.session.deviceId,
      deviceName: req.session.deviceName,
      lastSeenAt: req.session.lastSeenAt,
      createdAt: req.session.createdAt,
    },
  });
}

async function logout(req, res) {
  try {
    await authService.logout(req.session._id);

    return success(
      res,
      Codes.AUTH_LOGOUT_SUCCESS,
      {},
      200
    );
  } catch (error) {
    return fail(
      res,
      error.code || Codes.AUTH_INTERNAL_ERROR,
      400
    );
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.auth_refresh;

    const result = await authService.refresh(refreshToken);

    return success(res, Codes.AUTH_REFRESH_SUCCESS, result, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 401);
  }
}

async function sessions(req, res) {
  try {
    const sessions = await authService.getSessions(
      req.user._id,
      req.session._id
    );

    return success(res, Codes.AUTH_SESSIONS_SUCCESS, { sessions }, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

async function logoutAll(req, res) {
  try {
    await authService.logoutAll(req.user._id);

    return success(res, Codes.AUTH_LOGOUT_ALL_SUCCESS, {}, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  refresh,
  sessions,
  logoutAll,
};