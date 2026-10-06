const mongoose = require("mongoose");

const flashSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    userAvatar: {
      type: String,
      default: "",
    },
    file_url: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    filter: {
      type: String,
      default: "normal",
    },
    views: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      // MongoDB TTL Index: automatically purge documents after 24 hours
      index: { expires: 0 },
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("Flash", flashSchema);
