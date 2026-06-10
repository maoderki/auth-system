const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    roles: {
      type: [String],
      default: ["user"],
      index: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    lastSeenAt: {
      type: Date,
      default: null,
      index: true,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);