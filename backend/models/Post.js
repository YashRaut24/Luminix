const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
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

    comments: [commentSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Post", postSchema);