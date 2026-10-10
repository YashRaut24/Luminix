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

    // 8. Critique Mode
    needs_critique: {
      type: Boolean,
      default: false,
    },
    critique_question: {
      type: String,
      default: "",
    },
    critiques: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        profile_picture: String,
        what_works: { type: String, required: true },
        what_to_try: { type: String, required: true },
        is_helpful: { type: Boolean, default: false },
        created_at: { type: Date, default: Date.now },
      },
    ],

    // 9. Co-Authors
    co_authors: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        profile_picture: String,
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
        invited_at: { type: Date, default: Date.now },
        responded_at: { type: Date },
      },
    ],

    // 10. Whisper Notes (Private feedback for creator)
    whisper_notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        profile_picture: String,
        note: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
      },
    ],

    // Discovery Suite Fields
    // 11. Dominant Color Palette (5 hex codes)
    palette: [
      {
        type: String,
        trim: true,
      },
    ],

    // 12. Mood Dial (0 to 100)
    mood_calm_energetic: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    mood_minimal_detailed: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    // 13. Tool Tags (e.g. Figma, Procreate, Blender)
    tools: [
      {
        type: String,
        trim: true,
      },
    ],

    // 14. Provenance Chain & "Inspired by" attribution
    inspired_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    provenance_chain: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);