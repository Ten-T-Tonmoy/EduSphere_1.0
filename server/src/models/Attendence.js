// const mongoose = require("mongoose");

// const attendanceSchema = new mongoose.Schema(
//   {
//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     classSlot: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ClassSlot",
//       required: true,
//     },
//     classroom: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Classroom",
//       required: true,
//     },
//     course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
//     date: { type: Date, required: true },
//     status: {
//       type: String,
//       enum: ["attended", "missed", "exam", "holiday", "cancelled"],
//       required: true,
//     },
//     note: { type: String, default: "" },
//   },
//   { timestamps: true },
// );

// attendanceSchema.index({ student: 1, classSlot: 1, date: 1 }, { unique: true });

// module.exports = mongoose.model("Attendance", attendanceSchema);
