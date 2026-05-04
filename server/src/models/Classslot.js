const mongoose = require("mongoose");

const classSlotSchema = new mongoose.Schema(
  {
    group: { // Changed from 'classroom' to 'group'
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true }, 
    endTime: { type: String, required: true }, 

    isLab: { type: Boolean, default: false },
    labDuration: { type: Number, default: 1 }, 

    room: { type: String, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "extra", "rescheduled"],
      default: "scheduled",
    },
    cancellationReason: { type: String, default: "" },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    semester: { type: Number },
    academicYear: { type: String },
    isRecurring: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClassSlot", classSlotSchema);