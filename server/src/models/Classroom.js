// const mongoose = require("mongoose");

// const classroomSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     department: { type: String, required: true },
//     year: { type: Number, required: true },
//     currentSemester: { type: Number, required: true },
//     description: { type: String, default: "" },
//     teachers: [
//       {
//         user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         role: { type: String, default: "teacher" },
//       },
//     ],
//     students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     classRep: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     inviteCode: { type: String, unique: true },
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true },
// );

// classroomSchema.pre("save", function (next) {
//   if (!this.inviteCode) {
//     this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
//   }
//   next();
// });

// module.exports = mongoose.model("Classroom", classroomSchema);
