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
      required: true
    },

    username: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true
    },

    target: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },

    file_url: {
      type: String,
      required: true
    },

    file_name: {
      type: String,
      required: true,
      trim: true
    },

    caption: {
      type: String,
      trim: true,
      default: ""
    },

    tags: [{
      type: String,
      trim: true
    }],

    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    reposts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    shares: {
      type: Number,
      default: 0
    },

    views: {
      type: Number,
      default: 0
    },

    comments: [commentSchema],

    process_steps: [
      {
        step_number: { type: Number, default: 1 },
        phase_label: { type: String, default: "Work in Progress" },
        caption: { type: String, default: "" },
        file_url: { type: String, required: true }
      }
    ],

    remix_of: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null
    },

    remix_type: {
      type: String,
      default: "Remix"
    },

    remix_count: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Post", postSchema);