const mongoose = require("mongoose");

let isConnected = false;

async function connectDB(mongoUri) {
  if (isConnected) {
    return mongoose.connection;
  }

  if (!mongoUri) {
    throw new Error("AUTH_MONGO_URI_REQUIRED");
  }

  await mongoose.connect(mongoUri);

  isConnected = true;

  return mongoose.connection;
}

async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};