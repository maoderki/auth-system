#!/usr/bin/env node

const path = require("path");
const dotenv = require("dotenv");

// Load .env from the project directory where the command is executed.
dotenv.config({ path: path.join(process.cwd(), ".env") });

const express = require("express");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const cors = require("cors");

const { connectDB } = require("./src/config/db");
const auth = require("./index");
const env = require("./src/config/env");

const app = express();

function parseCorsOrigin(value) {
  if (!value || value === "*") {
    return value || false;
  }

  return value
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(helmet());

if (env.corsOrigin) {
  const corsOrigin = parseCorsOrigin(env.corsOrigin);

  app.use(
    cors({
      origin: corsOrigin,
      credentials: corsOrigin !== "*",
    })
  );
}

app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

app.get("/ping", (req, res) => {
  res.json({ ok: true, service: "auth-system" });
});

app.use("/", auth.router);

async function start() {
  try {
    await connectDB(env.mongoUri);

    app.listen(env.port, env.host, () => {
      console.log(`AUTH_SERVER_RUNNING http://${env.host}:${env.port}`);
    });
  } catch (error) {
    console.error("AUTH_SERVER_START_FAILED", error.message);
    process.exit(1);
  }
}

start();