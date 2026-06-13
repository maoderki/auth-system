#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prompts = require("prompts");

const User = require("./src/models/User");
const { connectDB, disconnectDB } = require("./src/config/db");
const defaults = require("./src/config/defaults");

const installedPath = path.join(process.cwd(), ".installed");
const envPath = path.join(process.cwd(), ".env");

if (fs.existsSync(installedPath)) {
  console.log("AUTH_SETUP_ALREADY_INSTALLED");
  process.exit(0);
}

function generateSecret() {
  return crypto.randomBytes(64).toString("hex");
}

async function main() {
  const response = await prompts([
    {
      type: "text",
      name: "mongoUri",
      message: "MongoDB URI:",
      validate: value =>
        value && value.length > 10 ? true : "AUTH_MONGO_URI_INVALID",
    },
    {
      type: "select",
      name: "loginIdentifier",
      message: "Login identifier:",
      choices: [
        { title: "Email only", value: "email" },
        { title: "Username only", value: "username" },
        { title: "Email or username", value: "both" },
      ],
      initial: 0,
    },
    {
      type: "text",
      name: "adminUsername",
      message: "Admin username:",
      validate: value =>
        value && value.length >= 3 ? true : "AUTH_ADMIN_USERNAME_INVALID",
    },
    {
      type: "text",
      name: "adminEmail",
      message: "Admin email:",
      validate: value =>
        value && value.includes("@") ? true : "AUTH_ADMIN_EMAIL_INVALID",
    },
    {
      type: "password",
      name: "adminPassword",
      message: "Admin password:",
      validate: value =>
        value && value.length >= defaults.password.minLength
          ? true
          : "AUTH_ADMIN_PASSWORD_INVALID",
    },
    {
      type: "toggle",
      name: "allowRegistration",
      message: "Allow public registration?",
      initial: defaults.allowRegistration,
      active: "yes",
      inactive: "no",
    },
    {
      type: "toggle",
      name: "emailVerificationEnabled",
      message: "Enable email verification?",
      initial: false,
      active: "yes",
      inactive: "no",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "select" : null,
      name: "mailProvider",
      message: "Mail provider:",
      choices: [
        { title: "Custom SMTP", value: "smtp" },
        { title: "Gmail / Google Workspace", value: "gmail" },
        { title: "Microsoft 365 / Exchange", value: "microsoft" },
        { title: "Yandex Mail", value: "yandex" },
      ],
      initial: 0,
    },
    {
      type: (prev, values) =>
        values.emailVerificationEnabled && values.mailProvider === "smtp"
          ? "text"
          : null,
      name: "mailHost",
      message: "SMTP host:",
    },
    {
      type: (prev, values) =>
        values.emailVerificationEnabled && values.mailProvider === "smtp"
          ? "number"
          : null,
      name: "mailPort",
      message: "SMTP port:",
      initial: 587,
    },
    {
      type: (prev, values) =>
        values.emailVerificationEnabled && values.mailProvider === "smtp"
          ? "toggle"
          : null,
      name: "mailSecure",
      message: "Use secure SMTP connection?",
      initial: false,
      active: "yes",
      inactive: "no",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "text" : null,
      name: "mailUser",
      message: "SMTP username:",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "password" : null,
      name: "mailPass",
      message: "SMTP password:",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "text" : null,
      name: "mailFromName",
      message: "Mail from name:",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "text" : null,
      name: "mailFromEmail",
      message: "Mail from email:",
      validate: value =>
        value && value.includes("@") ? true : "AUTH_MAIL_FROM_EMAIL_INVALID",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "text" : null,
      name: "appName",
      message: "App name:",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "text" : null,
      name: "frontendUrl",
      message: "Frontend URL:",
    },
    {
      type: (_, values) =>
        values.emailVerificationEnabled ? "text" : null,
      name: "appLogoUrl",
      message: "App logo URL optional:",
    },
  ]);

  if (!response.mongoUri || !response.adminEmail || !response.adminPassword) {
    console.log("AUTH_SETUP_CANCELLED");
    process.exit(1);
  }

  try {
    await connectDB(response.mongoUri);

    const existingUser = await User.findOne({
      email: response.adminEmail.toLowerCase(),
    });

    if (existingUser) {
      console.log("AUTH_EMAIL_ALREADY_EXISTS");
      await disconnectDB();
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(response.adminPassword, 12);

    await User.create({
      username: response.adminUsername.toLowerCase(),
      email: response.adminEmail.toLowerCase(),
      phone: null,
      passwordHash,
      roles: ["admin"],
      permissions: ["*"],
      isActive: true,
      isEmailVerified: true,
    });

    const mailDefaults = {
      smtp: {
        host: response.mailHost,
        port: response.mailPort || 587,
        secure: response.mailSecure || false,
      },
      gmail: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
      },
      microsoft: {
        host: "smtp.office365.com",
        port: 587,
        secure: false,
      },
      yandex: {
        host: "smtp.yandex.com.tr",
        port: 587,
        secure: false,
      },
    };

    const selectedMail =
      response.emailVerificationEnabled
        ? mailDefaults[response.mailProvider]
        : null;

    const mailEnvContent = response.emailVerificationEnabled
      ? `
AUTH_EMAIL_VERIFICATION_ENABLED=true

AUTH_MAIL_PROVIDER=${response.mailProvider}
AUTH_MAIL_HOST=${selectedMail.host}
AUTH_MAIL_PORT=${selectedMail.port}
AUTH_MAIL_SECURE=${selectedMail.secure}
AUTH_MAIL_USER=${response.mailUser}
AUTH_MAIL_PASS=${response.mailPass}
AUTH_MAIL_FROM_NAME=${response.mailFromName}
AUTH_MAIL_FROM_EMAIL=${response.mailFromEmail}

AUTH_APP_NAME=${response.appName}
AUTH_APP_URL=${response.frontendUrl}
AUTH_FRONTEND_URL=${response.frontendUrl}
AUTH_APP_LOGO_URL=${response.appLogoUrl || ""}
`
      : `
AUTH_EMAIL_VERIFICATION_ENABLED=false
`;

    const envContent = `AUTH_MONGO_URI=${response.mongoUri}
AUTH_ACCESS_SECRET=${generateSecret()}
AUTH_REFRESH_SECRET=${generateSecret()}

AUTH_ACCESS_EXPIRES=${defaults.accessTokenExpires}
AUTH_REFRESH_EXPIRES=${defaults.refreshTokenExpires}

AUTH_COOKIE_NAME=${defaults.cookieName}
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax

AUTH_ALLOW_REGISTRATION=${response.allowRegistration}
AUTH_LOGIN_IDENTIFIER=${response.loginIdentifier}

AUTH_PORT=4000
AUTH_HOST=0.0.0.0
AUTH_CORS_ORIGIN=
AUTH_TRUST_PROXY=true
${mailEnvContent}
`;

    fs.writeFileSync(envPath, envContent);
    fs.writeFileSync(
      installedPath,
      `installed_at=${new Date().toISOString()}\n`
    );

    console.log("AUTH_SETUP_SUCCESS");
    await disconnectDB();
  } catch (error) {
    console.error("AUTH_SETUP_FAILED", error.message);
    await disconnectDB();
    process.exit(1);
  }
}

main();