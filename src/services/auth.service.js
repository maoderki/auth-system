const User = require("../models/User");
const Session = require("../models/Session");
const VerificationToken = require("../models/VerificationToken");

const env = require("../config/env");
const defaults = require("../config/defaults");

const { renderTemplate } = require("../utils/template");
const path = require("path");
const MailMessages = require("../constants/mailMessages");

const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const { hashPassword, comparePassword } = require("../utils/password");
const { sha256 } = require("../utils/hash");

const {
  generateRawToken,
  hashToken,
} = require("../utils/token");

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

    if (env.emailVerificationEnabled) {
      try {
        await this.sendVerificationEmail(user);
      } catch (error) {
        console.error("AUTH_VERIFICATION_EMAIL_SEND_FAILED", error.message);
      }
    }
    return this.sanitizeUser(user);
  }

  async login({ identifier, password, deviceId, deviceName, userAgent, ipAddress }) {
    const query = this.buildLoginQuery(identifier);

    const user = await User.findOne(query);

    if (!user || !user.isActive) {
      const error = new Error("AUTH_INVALID_CREDENTIALS");
      error.code = "AUTH_INVALID_CREDENTIALS";
      throw error;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const error = new Error("AUTH_ACCOUNT_LOCKED");
      error.code = "AUTH_ACCOUNT_LOCKED";
      throw error;
    }

    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= defaults.loginLock.maxAttempts) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + defaults.loginLock.lockMinutes);

        user.lockUntil = lockUntil;
      }

      await user.save();

      const error = new Error(
        user.lockUntil && user.lockUntil > new Date()
          ? "AUTH_ACCOUNT_LOCKED"
          : "AUTH_INVALID_CREDENTIALS"
      );

      error.code =
        user.lockUntil && user.lockUntil > new Date()
          ? "AUTH_ACCOUNT_LOCKED"
          : "AUTH_INVALID_CREDENTIALS";

      throw error;
    }

    const now = new Date();

    const activeSessions = await Session.countDocuments({
      userId: user._id,
      isActive: true,
    });

    if (activeSessions >= defaults.maxSessionsPerUser) {
      const oldestSession = await Session.findOne({
        userId: user._id,
        isActive: true,
      }).sort({ lastSeenAt: 1, createdAt: 1 });

      if (oldestSession) {
        oldestSession.isActive = false;
        oldestSession.loggedOutAt = now;
        await oldestSession.save();
      }
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    const sessionId = new mongoose.Types.ObjectId();

    const access = signAccessToken(user, sessionId);
    const refreshToken = signRefreshToken(user, sessionId);

    const session = await Session.create({
      _id: sessionId,
      userId: user._id,
      deviceId,
      deviceName: deviceName || null,
      refreshTokenHash: sha256(refreshToken),
      accessTokenJti: access.jti,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      isActive: true,
      lastSeenAt: now,
      expiresAt: this.getRefreshExpiresAt(),
    });

    user.lastLoginAt = now;
    user.lastSeenAt = now;
    await user.save();

    return {
      user: this.sanitizeUser(user),
      accessToken: access.token,
      refreshToken,
      sessionId: session._id,
    };
  }

  createMailTransporter() {
    return nodemailer.createTransport({
      host: env.mailHost,
      port: env.mailPort,
      secure: env.mailSecure,
      auth: {
        user: env.mailUser,
        pass: env.mailPass,
      },
    });
  }

  async sendMail({ to, subject, html, text }) {
    const transporter = this.createMailTransporter();

    return transporter.sendMail({
      from: `"${env.mailFromName}" <${env.mailFromEmail}>`,
      to,
      subject,
      html,
      text,
    });
  }

  async createVerificationToken(userId, type, expiresInMinutes) {
    const rawToken = generateRawToken();
    const tokenHashValue = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000
    );

    await VerificationToken.deleteMany({
      userId,
      type,
      usedAt: null,
    });

    await VerificationToken.create({
      userId,
      type,
      tokenHash: tokenHashValue,
      expiresAt,
    });

    return rawToken;
  }

  async sendTemplateMail({ to, template, variables, subject, text }) {
    const html = await renderTemplate(
      path.join(__dirname, `../templates/emails/${template}.html`),
      variables
    );

    return this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }

  async sendVerificationEmail(user) {
    const expiresMinutes = defaults.verification.emailVerifyMinutes;

    const token = await this.createVerificationToken(
      user._id,
      "email_verify",
      expiresMinutes
    );

    const verifyUrl =
      `${env.frontendUrl}/verify-email?token=${token}`;

    return this.sendTemplateMail({
      to: user.email,
      template: "verify-email",
      variables: {
        logoUrl: env.appLogoUrl,
        appName: env.appName,
        username: user.username,
        verifyUrl,
        expiresMinutes,
      },
      subject: MailMessages.EMAIL_VERIFY.subject,
      text: `${MailMessages.EMAIL_VERIFY.text} ${verifyUrl}`,
    });
  }

  async sendPasswordResetEmail(user) {
    const expiresMinutes = defaults.verification.passwordResetMinutes;

    const token = await this.createVerificationToken(
      user._id,
      "password_reset",
      expiresMinutes
    );

    const resetUrl =
      `${env.frontendUrl}/reset-password?token=${token}`;

    return this.sendTemplateMail({
      to: user.email,
      template: "reset-password",
      variables: {
        logoUrl: env.appLogoUrl,
        appName: env.appName,
        username: user.username,
        resetUrl,
        expiresMinutes,
      },
      subject: MailMessages.PASSWORD_RESET.subject,
      text: `${MailMessages.PASSWORD_RESET.text} ${resetUrl}`,
    });
  }

  async verifyEmail(token) {
    if (!env.emailVerificationEnabled) {
      const error = new Error("AUTH_EMAIL_VERIFICATION_DISABLED");
      error.code = "AUTH_EMAIL_VERIFICATION_DISABLED";
      throw error;
    }
    const tokenHashValue = hashToken(token);

    const verificationToken = await VerificationToken.findOne({
      tokenHash: tokenHashValue,
      type: "email_verify",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      const error = new Error("AUTH_EMAIL_VERIFY_TOKEN_INVALID");
      error.code = "AUTH_EMAIL_VERIFY_TOKEN_INVALID";
      throw error;
    }

    const user = await User.findById(verificationToken.userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    user.isEmailVerified = true;
    await user.save();

    verificationToken.usedAt = new Date();
    await verificationToken.save();

    return this.sanitizeUser(user);
  }

  async resendVerificationEmail(email) {
    if (!env.emailVerificationEnabled) {
      const error = new Error("AUTH_EMAIL_VERIFICATION_DISABLED");
      error.code = "AUTH_EMAIL_VERIFICATION_DISABLED";
      throw error;
    }
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

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

    if (user.isEmailVerified) {
      const error = new Error("AUTH_EMAIL_ALREADY_VERIFIED");
      error.code = "AUTH_EMAIL_ALREADY_VERIFIED";
      throw error;
    }

    await this.sendVerificationEmail(user);

    return true;
  }

  async forgotPassword(email) {
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    // Güvenlik için kullanıcı yoksa bile success döneceğiz
    if (!user) {
      return true;
    }

    await this.sendPasswordResetEmail(user);

    return true;
  }

  async resetPassword(token, newPassword) {
    const tokenHashValue = hashToken(token);

    const verificationToken = await VerificationToken.findOne({
      tokenHash: tokenHashValue,
      type: "password_reset",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      const error = new Error("AUTH_PASSWORD_RESET_TOKEN_INVALID");
      error.code = "AUTH_PASSWORD_RESET_TOKEN_INVALID";
      throw error;
    }

    const user = await User.findById(
      verificationToken.userId
    );

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.tokenVersion += 1;

    await user.save();

    verificationToken.usedAt = new Date();
    await verificationToken.save();

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

    if (!user || !user.isActive) {
      const error = new Error("AUTH_REFRESH_TOKEN_INVALID");
      error.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw error;
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      const error = new Error("AUTH_REFRESH_TOKEN_INVALID");
      error.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw error;
    }

    const access = signAccessToken(user, decoded.sid);
    const newRefreshToken = signRefreshToken(user, decoded.sid);

    const session = await Session.findOneAndUpdate(
      {
        _id: decoded.sid,
        userId: user._id,
        isActive: true,
        refreshTokenHash: sha256(refreshToken),
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          refreshTokenHash: sha256(newRefreshToken),
          accessTokenJti: access.jti,
          lastSeenAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!session) {
      const error = new Error("AUTH_REFRESH_TOKEN_INVALID");
      error.code = "AUTH_REFRESH_TOKEN_INVALID";
      throw error;
    }

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

  async updateUserRoles(userId, roles) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    user.roles = [...new Set(roles.map(role => role.toLowerCase()))];
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

    return this.sanitizeUser(user);
  }
  async listUsers({ page = 1, limit = 20, search = "" }) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const filter = {};

    if (search) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { username: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),

      User.countDocuments(filter),
    ]);

    return {
      users: users.map(user => this.sanitizeUser(user)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit),
      },
    };
  }
  async getUserById(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    return this.sanitizeUser(user);
  }

  async updateUser(userId, data) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    if (data.email) {
      const email = data.email.toLowerCase();

      const existingEmail = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (existingEmail) {
        const error = new Error("AUTH_EMAIL_ALREADY_EXISTS");
        error.code = "AUTH_EMAIL_ALREADY_EXISTS";
        throw error;
      }

      user.email = email;
      user.isEmailVerified = false;
    }

    if (data.username) {
      const username = data.username.toLowerCase();

      const existingUsername = await User.findOne({
        username,
        _id: { $ne: user._id },
      });

      if (existingUsername) {
        const error = new Error("AUTH_USERNAME_ALREADY_EXISTS");
        error.code = "AUTH_USERNAME_ALREADY_EXISTS";
        throw error;
      }

      user.username = username;
    }

    if (Object.prototype.hasOwnProperty.call(data, "phone")) {
      user.phone = data.phone || null;
    }

    user.tokenVersion += 1;

    await user.save();
    await this.logoutAll(user._id);

    return this.sanitizeUser(user);
  }

  async updateUserStatus(userId, isActive) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    user.isActive = isActive;
    user.tokenVersion += 1;

    await user.save();

    if (!isActive) {
      await this.logoutAll(user._id);
    }

    return this.sanitizeUser(user);
  }

  async adminUpdateUserPassword(userId, newPassword) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("AUTH_USER_NOT_FOUND");
      error.code = "AUTH_USER_NOT_FOUND";
      throw error;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.tokenVersion += 1;

    await user.save();
    await this.logoutAll(user._id);

    return true;
  }
}

module.exports = new AuthService();