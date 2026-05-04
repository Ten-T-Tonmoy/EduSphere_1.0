const mongoose = require("mongoose");

const slotOverrideSchema = new mongoose.Schema(
  {
    classSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSlot",
      required: true,
    },
    // CHANGED: This is now 'group' instead of 'classroom'
    group: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    date: { 
      type: Date, 
      required: true 
    },
    type: {
      type: String,
      enum: ["cancellation", "extra"],
      required: true,
    },
    cancellationReason: { 
      type: String, 
      default: "" 
    },
    cancelledBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    extraClassRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExtraClassRequest",
    },
    extraCourse: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Course" 
    },
    extraTeacher: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.SlotOverride || mongoose.model("SlotOverride", slotOverrideSchema);