const authService = require("../services/auth.service");
const Codes = require("../constants/responseCodes");
const { success, fail } = require("../utils/response");
const { setRefreshCookie, clearRefreshCookie } = require("../utils/cookie");
const env = require("../config/env");

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

    setRefreshCookie(res, result.refreshToken);

    return success(
      res,
      Codes.AUTH_LOGIN_SUCCESS,
      {
        user: result.user,
        accessToken: result.accessToken,
        sessionId: result.sessionId,
      },
      200
    );
  } catch (error) {
    const status =
      error.code === Codes.AUTH_ACCOUNT_LOCKED ? 423 : 401;

    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
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
    clearRefreshCookie(res);

    return success(res, Codes.AUTH_LOGOUT_SUCCESS, {}, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

async function refresh(req, res) {
  try {
    const refreshToken =
      req.cookies?.[env.cookieName] ||
      req.body.refreshToken;

    const result = await authService.refresh(refreshToken);

    setRefreshCookie(res, result.refreshToken);

    return success(
      res,
      Codes.AUTH_REFRESH_SUCCESS,
      {
        user: result.user,
        accessToken: result.accessToken,
        sessionId: result.sessionId,
      },
      200
    );
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
    clearRefreshCookie(res);

    return success(res, Codes.AUTH_LOGOUT_ALL_SUCCESS, {}, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

async function logoutSession(req, res) {
  try {
    await authService.logoutSession(req.user._id, req.params.id);
    return success(res, Codes.AUTH_SESSION_LOGOUT_SUCCESS, {}, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 404);
  }
}

async function verifyEmail(req, res) {
  try {
    const user = await authService.verifyEmail(req.query.token);

    return success(
      res,
      Codes.AUTH_EMAIL_VERIFIED,
      { user },
      200
    );
  } catch (error) {
    const status =
      error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;

    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function resendVerificationEmail(req, res) {
  try {
    await authService.resendVerificationEmail(req.body.email);

    return success(
      res,
      Codes.AUTH_VERIFICATION_EMAIL_SENT,
      {},
      200
    );
  } catch (error) {
    const status =
      error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;

    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function changePassword(req, res) {
  try {
    await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );

    clearRefreshCookie(res);

    return success(res, Codes.AUTH_PASSWORD_CHANGED, {}, 200);
  } catch (error) {
    const status =
      error.code === Codes.AUTH_CURRENT_PASSWORD_INVALID ? 400 : 401;

    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function updateUserRoles(req, res) {
  try {
    const user = await authService.updateUserRoles(
      req.params.id,
      req.body.roles
    );

    return success(
      res,
      Codes.AUTH_USER_ROLE_UPDATED,
      { user },
      200
    );
  } catch (error) {
    const status =
      error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;

    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function listUsers(req, res) {
  try {
    const result = await authService.listUsers({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });

    return success(res, Codes.AUTH_USERS_LIST_SUCCESS, result, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

async function getUser(req, res) {
  try {
    const user = await authService.getUserById(req.params.id);
    return success(res, Codes.AUTH_USER_DETAIL_SUCCESS, { user }, 200);
  } catch (error) {
    const status = error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function updateUser(req, res) {
  try {
    const user = await authService.updateUser(req.params.id, req.body);
    return success(res, Codes.AUTH_USER_UPDATED, { user }, 200);
  } catch (error) {
    const status = error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function updateProfile(req, res) {
  try {
    const user = await authService.updateUser(req.user._id, req.body);
    clearRefreshCookie(res);

    return success(res, Codes.AUTH_PROFILE_UPDATED, { user }, 200);
  } catch (error) {
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, 400);
  }
}

async function updateUserStatus(req, res) {
  try {
    const user = await authService.updateUserStatus(
      req.params.id,
      req.body.isActive
    );

    return success(res, Codes.AUTH_USER_STATUS_UPDATED, { user }, 200);
  } catch (error) {
    const status = error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
  }
}

async function adminUpdateUserPassword(req, res) {
  try {
    await authService.adminUpdateUserPassword(
      req.params.id,
      req.body.newPassword
    );

    return success(res, Codes.AUTH_USER_PASSWORD_UPDATED, {}, 200);
  } catch (error) {
    const status = error.code === Codes.AUTH_USER_NOT_FOUND ? 404 : 400;
    return fail(res, error.code || Codes.AUTH_INTERNAL_ERROR, status);
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
  logoutSession,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  updateUserRoles,
  listUsers,
  getUser,
  updateUser,
  updateProfile,
  updateUserStatus,
  adminUpdateUserPassword,
};