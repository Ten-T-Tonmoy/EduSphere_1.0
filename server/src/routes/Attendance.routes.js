// const express = require("express");
// const router = express.Router();
// const Attendance = require("../models/Attendence.js");
// const { auth, authorize } = require("../middleware/Auth.js");

// //---------------------self attendence marking-----------------------

// router.post("/", auth, async (req, res) => {
//   try {
//     const { classSlot, classroom, course, date, status, note } = req.body;
//     const existing = await Attendance.findOne({
//       student: req.user._id,
//       classSlot,
//       date: new Date(date).toDateString(),
//     });
//     if (existing) {
//       existing.status = status;
//       existing.note = note || "";
//       await existing.save();
//       return res.json(existing);
//     }
//     const attendance = await Attendance.create({
//       student: req.user._id,
//       classSlot,
//       classroom,
//       course,
//       date,
//       status,
//       note,
//     });
//     res.status(201).json(attendance);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// //-----------------------------------get attendence from  class-------------------
// router.get("/my/:classroomId", auth, async (req, res) => {
//   try {
//     const records = await Attendance.find({
//       student: req.user._id,
//       classroom: req.params.classroomId,
//     })
//       .populate("classSlot", "dayOfWeek startTime endTime")
//       .populate("course", "name code")
//       .sort({ date: -1 });
//     res.json(records);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ---------------------get attendance summary per course---------
// router.get("/summary/:classroomId", auth, async (req, res) => {
//   try {
//     const records = await Attendance.find({
//       student: req.user._id,
//       classroom: req.params.classroomId,
//     }).populate("course", "name code");

//     const summary = {};
//     records.forEach((r) => {
//       const courseId = r.course?._id?.toString() || "uncategorized";
//       const courseName = r.course?.name || "General";
//       if (!summary[courseId]) {
//         summary[courseId] = {
//           courseName,
//           attended: 0,
//           missed: 0,
//           exam: 0,
//           total: 0,
//         };
//       }
//       summary[courseId].total++;
//       if (r.status === "attended") summary[courseId].attended++;
//       else if (r.status === "missed") summary[courseId].missed++;
//       else if (r.status === "exam") summary[courseId].exam++;
//     });

//     res.json(Object.values(summary));
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// //-------------------------------classroom attendance for teacher-----------------
// router.get(
//   "/classroom/:classroomId",
//   auth,
//   authorize("teacher", "admin", "class_rep"),
//   async (req, res) => {
//     try {
//       const records = await Attendance.find({
//         classroom: req.params.classroomId,
//       })
//         .populate("student", "name studentId")
//         .populate("course", "name code")
//         .sort({ date: -1 });
//       res.json(records);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   },
// );

// //---------------------------today's attendance for student-----------------
// router.get("/today", auth, async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const records = await Attendance.find({
//       student: req.user._id,
//       date: { $gte: today, $lt: tomorrow },
//     }).populate("classSlot course classroom");
//     res.json(records);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// //------------------------- Interactive Course Matrix View -------------------------
// router.get("/matrix/:groupId/:courseId", auth, async (req, res) => {
//   try {
//     // $or handles both the old 'classroom' reference and new 'group' reference just in case
//     const records = await Attendance.find({
//       $or: [{ classroom: req.params.groupId }, { group: req.params.groupId }],
//       course: req.params.courseId
//     }).populate("student", "name studentId");

//     // Extract unique dates where class actually happened
//     const dateSet = new Set();
//     records.forEach(r => {
//       if (r.date) dateSet.add(new Date(r.date).toDateString());
//     });
//     const dates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

//     // Map records to specific students
//     const studentMap = {};
//     records.forEach(r => {
//       if (!r.student) return;
//       const sId = r.student._id.toString();
//       if (!studentMap[sId]) {
//         studentMap[sId] = {
//           studentId: r.student.studentId,
//           name: r.student.name,
//           attendance: {}
//         };
//       }
//       studentMap[sId].attendance[new Date(r.date).toDateString()] = r.status;
//     });

//     // Sort students by Student ID (Ascending Low -> Top)
//     const students = Object.values(studentMap).sort((a, b) => {
//        const numA = parseInt(a.studentId?.replace(/\D/g, '')) || 0;
//        const numB = parseInt(b.studentId?.replace(/\D/g, '')) || 0;
//        if (numA && numB) return numA - numB;
//        return (a.studentId || '').localeCompare(b.studentId || '');
//     });

//     res.json({ dates, students });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;