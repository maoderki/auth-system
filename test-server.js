const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const { connectDB } = require("./src/config/db");
const auth = require("./index");
const env = require("./src/config/env");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

connectDB(env.mongoUri)
  .then(() => {
    console.log("DB_CONNECTED");
  })
  .catch(error => {
    console.error("DB_CONNECTION_FAILED", error.message);
  });

app.use("/auth", auth.router);

app.listen(5050, "127.0.0.1", () => {
  console.log("TEST_SERVER_RUNNING_ON_5050");
});

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});