const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: {
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
  text: {
    type: String,
    required: true,
    trim: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  reactions: {
    fire: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    idea: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    art: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rocket: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema(
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

    email: {
      type: String,
      required: true,
      trim: true,
    },

    target: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    file_url: {
      type: String,
      required: true,
    },

    file_name: {
      type: String,
      required: true,
      trim: true,
    },

    caption: {
      type: String,
      trim: true,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reposts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    shares: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    comments: [commentSchema],

    // 1. Post Type Variant
    post_type: {
      type: String,
      enum: ["standard", "before_after", "timelapse", "time_capsule"],
      default: "standard",
    },

    // 2. Before/After Comparison
    before_after: {
      before_image_url: { type: String, default: "" },
      after_image_url: { type: String, default: "" },
      before_label: { type: String, default: "Original" },
      after_label: { type: String, default: "Final" },
    },

    // 3. Process Steps & Time-Lapse
    process_steps: [
      {
        step_number: { type: Number, default: 1 },
        phase_label: { type: String, default: "Work in Progress" },
        caption: { type: String, default: "" },
        file_url: { type: String, required: true },
      },
    ],

    // 4. Version History (v1, v2, v3...)
    versions: [
      {
        version_number: { type: Number, required: true },
        file_url: { type: String, required: true },
        note: { type: String, default: "Initial Version" },
        date: { type: Date, default: Date.now },
      },
    ],

    // 5. Series & Chapters
    series: {
      series_id: { type: String, default: "" },
      series_name: { type: String, default: "" },
      chapter_number: { type: Number, default: 1 },
      total_chapters: { type: Number, default: 1 },
    },

    // 6. Time Capsule Reveal
    time_capsule: {
      is_capsule: { type: Boolean, default: false },
      reveal_date: { type: Date, default: null },
      is_revealed: { type: Boolean, default: false },
      hint: { type: String, default: "" },
    },

    // 7. Ambient Sound Layer
    sound_layer: {
      audio_url: { type: String, default: "" },
      audio_title: { type: String, default: "" },
      auto_loop: { type: Boolean, default: true },
    },

    remix_of: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    remix_type: {
      type: String,
      default: "Remix",
    },

    remix_count: {
      type: Number,
      default: 0,
    },

    is_scheduled: {
      type: Boolean,
      default: false,
    },

    scheduled_for: {
      type: Date,
      default: null,
    },

    published: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);