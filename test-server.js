const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

dotenv.config();

const { connectDB } = require("./src/config/db");
const auth = require("./index");
const env = require("./src/config/env");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

connectDB(env.mongoUri)
  .then(() => {
    console.log("DB_CONNECTED");
  })
  .catch(error => {
    console.error("DB_CONNECTION_FAILED", error.message);
  });

app.use("/auth", auth.router);

app.get(
  "/admin-test",
  auth.requireAuth,
  auth.requireRole("admin"),
  (req, res) => {
    res.json({ ok: true, message: "ADMIN_ACCESS_GRANTED" });
  }
);

app.listen(5050, "127.0.0.1", () => {
  console.log("TEST_SERVER_RUNNING_ON_5050");
});