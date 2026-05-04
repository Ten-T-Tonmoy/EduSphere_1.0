const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  type: {
    type: String,
    enum: [
      "holiday",
      "exam",
      "semester_start",
      "semester_end",
      "registration",
      "result",
      "event",
      "other",
    ],
    default: "event",
  },
  color: { type: String, default: "#3B82F6" },
});

const academicCalendarSchema = new mongoose.Schema(
  {
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true },
    events: [eventSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AcademicCalendar", academicCalendarSchema);
