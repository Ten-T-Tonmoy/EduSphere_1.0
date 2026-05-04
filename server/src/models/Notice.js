const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    // Changed from 'classroom' to 'group' to align with your Group features
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    // Changed from 'postedBy' to 'createdBy' to fix the "path required" error
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      // Explicitly included 'normal' to fix the enum validation error
      enum: ["low", "normal", "medium", "high", "urgent"],
      default: "normal",
    },
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
        fileType: { type: String },
        fileSize: { type: Number }
      },
    ],
    isPinned: { type: Boolean, default: false },
    expiresAt: { type: Date },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

module.exports = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);