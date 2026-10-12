const mongoose = require("mongoose");

const critiqueSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatar: {
      type: String,
      default: "",
    },
    works: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
      trim: true,
    },
    tryNext: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
      trim: true,
    },
    helpful: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce at database level that each person submits at most one critique per post
critiqueSchema.index({ postId: 1, authorId: 1 }, { unique: true });

module.exports = mongoose.model("Critique", critiqueSchema);
