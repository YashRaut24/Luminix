const mongoose = require("mongoose");

const weeklyChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    endsAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Backwards compatibility aliases
    theme: {
      type: String,
      trim: true,
      default: function () {
        return this.title;
      },
    },
    prompt_tag: {
      type: String,
      trim: true,
      lowercase: true,
      default: function () {
        return (this.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      },
    },
    description: {
      type: String,
      default: function () {
        return this.prompt;
      },
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
      default: function () {
        return this.startsAt;
      },
    },
    ends_at: {
      type: Date,
      default: function () {
        return this.endsAt;
      },
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

// Pre-save hook to synchronize legacy fields
weeklyChallengeSchema.pre("save", function (next) {
  if (this.title && !this.theme) this.theme = this.title;
  if (!this.title && this.theme) this.title = this.theme;
  if (this.prompt && !this.description) this.description = this.prompt;
  if (!this.prompt && this.description) this.prompt = this.description;
  if (this.startsAt && !this.starts_at) this.starts_at = this.startsAt;
  if (!this.startsAt && this.starts_at) this.startsAt = this.starts_at;
  if (this.endsAt && !this.ends_at) this.ends_at = this.endsAt;
  if (!this.endsAt && this.ends_at) this.endsAt = this.ends_at;
  next();
});

module.exports = mongoose.model("WeeklyChallenge", weeklyChallengeSchema);
