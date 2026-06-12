const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    deviceName: {
      type: String,
      default: null,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      index: true,
    },

    accessTokenJti: {
      type: String,
      default: null,
      index: true,
    },

    userAgent: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },

    loggedOutAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ expiresAt: 1 },{ expireAfterSeconds: 0 });

module.exports = mongoose.models.Session || mongoose.model("Session", sessionSchema);