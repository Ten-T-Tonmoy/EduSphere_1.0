const mongoose = require("mongoose");

const extraClassRequestSchema = new mongoose.Schema(
  {
    // CHANGED: This is now 'targetGroup' instead of 'targetClassroom'
    targetGroup: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    emptySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSlot",
      default: null,
    },
    course: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course" 
    },
    reason: { 
      type: String, 
      required: true 
    },
    requestType: { 
      type: String, 
      enum: ['add', 'cancel'], 
      default: 'add' 
    },
    requestedDate: { 
      type: Date, 
      required: true 
    },
    dayOfWeek: { type: Number },
    startTime: { type: String },
    endTime: { type: String },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewNote: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.ExtraClassRequest || mongoose.model("ExtraClassRequest", extraClassRequestSchema);
