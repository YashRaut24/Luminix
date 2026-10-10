const mongoose = require("mongoose");

const commissionInquirySchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client_name: {
      type: String,
      required: true,
      trim: true,
    },
    client_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    project_type: {
      type: String,
      default: "Illustration",
    },
    budget: {
      type: String,
      default: "",
    },
    deadline: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CommissionInquiry", commissionInquirySchema);
