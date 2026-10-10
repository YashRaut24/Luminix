const mongoose = require("mongoose");

const circleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    invite_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
        joined_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    prompt: {
      theme: {
        type: String,
        default: "Weekly Circle Prompt",
      },
      description: {
        type: String,
        default: "Share your latest explorations and study frames",
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Circle", circleSchema);
