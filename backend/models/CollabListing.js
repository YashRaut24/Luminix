const mongoose = require("mongoose");

const collabListingSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    author_avatar: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    role_needed: {
      type: String,
      required: true,
      trim: true,
    },
    skills_needed: [
      {
        type: String,
        trim: true,
      },
    ],
    project_timeline: {
      type: String,
      default: "Flexible",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
    },
    pitches: [
      {
        applicant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        avatar: String,
        message: {
          type: String,
          required: true,
        },
        portfolio_link: {
          type: String,
          default: "",
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CollabListing", collabListingSchema);
