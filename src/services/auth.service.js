const User = require("../models/User");
const Session = require("../models/Session");

const env = require("../config/env");
const defaults = require("../config/defaults");

const { hashPassword, comparePassword } = require("../utils/password");
const { sha256 } = require("../utils/hash");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

class AuthService {
  async register({ username, email, phone, password }) {
    if (!env.allowRegistration) {
      const error = new Error("AUTH_REGISTRATION_DISABLED");
      error.code = "AUTH_REGISTRATION_DISABLED";
      throw error;
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      const error = new Error("AUTH_USER_ALREADY_EXISTS");
      error.code = "AUTH_USER_ALREADY_EXISTS";
      throw error;
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone: phone || null,
      passwordHash,
      roles: ["user"],
      permissions: [],
      isActive: true,
      isEmailVerified: false,
    });

    return this.sanitizeUser(user);
  }

  async login({ identifier, password, deviceId, deviceName, userAgent, ipAddress }) {
    const query = this.buildLoginQuery(identifier);

    const user = await User.findOne(query);

    if (!user) {
      const error = new Error("AUTH_INVALID_CREDENTIALS");
      error.code = "AUTH_INVALID_CREDENTIALS";
      throw error;
    }

    if (!user.isActive) {
      const error = new Error("AUTH_USER_INACTIVE");
      error.code = "AUTH_USER_INACTIVE";
      throw error;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const error = new Error("AUTH_INVALID_CREDENTIALS");
      error.code = "AUTH_INVALID_CREDENTIALS";
      throw error;
    }

    const now = new Date();

    const tempSession = await Session.create({
      userId: user._id,
      deviceId,
      deviceName: deviceName || null,
      refreshTokenHash: "pending",
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      isActive: true,
      lastSeenAt: now,
      expiresAt: this.getRefreshExpiresAt(),
    });

    const access = signAccessToken(user, tempSession._id);
    const refreshToken = signRefreshToken(user, tempSession._id);

    tempSession.refreshTokenHash = sha256(refreshToken);
    tempSession.accessTokenJti = access.jti;
    await tempSession.save();

    user.lastLoginAt = now;
    user.lastSeenAt = now;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      accessToken: access.token,
      refreshToken,
      sessionId: tempSession._id,
    };
  }

  buildLoginQuery(identifier) {
    const value = identifier.toLowerCase();

    if (env.loginIdentifier === "email") {
      return { email: value };
    }

    if (env.loginIdentifier === "username") {
      return { username: value };
    }

    return {
      $or: [
        { email: value },
        { username: value },
      ],
    };
  }

  getRefreshExpiresAt() {
    const days = 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  sanitizeUser(user) {
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      permissions: user.permissions,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      lastSeenAt: user.lastSeenAt,
      createdAt: user.createdAt,
    };
  }

  async logout(sessionId) {
    const session = await Session.findById(sessionId);

    if (!session) {
      return true;
    }

    session.isActive = false;
    session.loggedOutAt = new Date();

    await session.save();

    return true;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      const error = new Error("AUTH_REFRESH_TOKEN_MISSING");
      error.code = "AUTH_REFRESH_TOKEN_MISSING";
      throw error;
    }

    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      const err = new Error("AUTH_REFRESH_TOKEN_INVALID");
      err.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw err;
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    if (!user.isActive) {
      const error = new Error("AUTH_USER_INACTIVE");
      error.code = "AUTH_USER_INACTIVE";
      throw error;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      const error = new Error("AUTH_REFRESH_TOKEN_INVALID");
      error.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw error;
    }

    const session = await Session.findOne({
      _id: decoded.sid,
      userId: user._id,
      isActive: true,
    });

    if (!session) {
      const error = new Error("AUTH_REFRESH_TOKEN_INVALID");
      error.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw error;
    }

    if (session.expiresAt < new Date()) {
      session.isActive = false;
      session.loggedOutAt = new Date();
      await session.save();

      const error = new Error("AUTH_REFRESH_TOKEN_EXPIRED");
      error.code = "AUTH_REFRESH_TOKEN_EXPIRED";
      throw error;
    }

    if (session.refreshTokenHash !== sha256(refreshToken)) {
      const error = new Error("AUTH_REFRESH_TOKEN_INVALID");
      error.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw error;
    }

    const access = signAccessToken(user, session._id);
    const newRefreshToken = signRefreshToken(user, session._id);

    session.refreshTokenHash = sha256(newRefreshToken);
    session.accessTokenJti = access.jti;
    session.lastSeenAt = new Date();

    await session.save();

    user.lastSeenAt = new Date();
    await user.save();

    return {
      user: this.sanitizeUser(user),
      accessToken: access.token,
      refreshToken: newRefreshToken,
      sessionId: session._id,
    };
  }
  async getSessions(userId, currentSessionId) {
    const sessions = await Session.find({
      userId,
      isActive: true,
    }).sort({ lastSeenAt: -1 });

    return sessions.map(session => ({
      id: session._id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
      isCurrent: session._id.toString() === currentSessionId.toString(),
    }));
  }
  async logoutAll(userId) {
    await Session.updateMany(
      {
        userId,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          loggedOutAt: new Date(),
        },
      }
    );

    return true;
  }
  async logoutSession(userId, sessionId) {
    const session = await Session.findOne({
      _id: sessionId,
      userId,
      isActive: true,
    });

    if (!session) {
      const error = new Error("AUTH_SESSION_NOT_FOUND");
      error.code = "AUTH_SESSION_NOT_FOUND";
      throw error;
    }

    session.isActive = false;
    session.loggedOutAt = new Date();

    await session.save();

    return true;
  }
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    const isPasswordValid = await comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      const error = new Error("AUTH_CURRENT_PASSWORD_INVALID");
      error.code = "AUTH_CURRENT_PASSWORD_INVALID";
      throw error;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.tokenVersion += 1;

    await user.save();

    await Session.updateMany(
      {
        userId: user._id,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          loggedOutAt: new Date(),
        },
      }
    );

    return true;
  }
}

module.exports = new AuthService();