const mongoose = require("mongoose");

const weeklyChallengeSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      required: true,
      trim: true,
    },
    prompt_tag: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    week_number: {
      type: Number,
      default: 1,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    starts_at: {
      type: Date,
      default: Date.now,
    },
    ends_at: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    rules: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WeeklyChallenge", weeklyChallengeSchema);
