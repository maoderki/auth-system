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
      type: "text",
      name: "adminPhone",
      message: "Admin phone optional:",
    },
    {
      type: "toggle",
      name: "allowRegistration",
      message: "Allow public registration?",
      initial: defaults.allowRegistration,
      active: "yes",
      inactive: "no",
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
      phone: response.adminPhone || null,
      passwordHash,
      roles: ["admin"],
      permissions: ["*"],
      isActive: true,
      isEmailVerified: true,
    });

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