// const express = require("express");
// const router = express.Router();
// const Classroom = require("../models/Classroom");
// const User = require("../models/User");
// const { auth, authorize } = require("../middleware/Auth");

// // ------------------- all classrooms for current user-------------------
// router.get("/", auth, async (req, res) => {
//   try {
//     let classrooms;
//     if (req.user.role === "admin") {
//       classrooms = await Classroom.find().populate(
//         "teachers.user students classRep",
//         "-password",
//       );
//     } else if (req.user.role === "teacher") {
//       classrooms = await Classroom.find({
//         "teachers.user": req.user._id,
//       }).populate("teachers.user students classRep", "-password");
//     } else {
//       classrooms = await Classroom.find({ students: req.user._id }).populate(
//         "teachers.user classRep",
//         "-password",
//       );
//     }
//     res.json(classrooms);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // -------------------create classroom (teacher/admin)-------------------------
// router.post("/", auth, authorize("teacher", "admin"), async (req, res) => {
//   try {
//     const { name, department, year, currentSemester, description } = req.body;
//     const classroom = await Classroom.create({
//       name,
//       department,
//       year,
//       currentSemester,
//       description,
//       teachers: [{ user: req.user._id }],
//     });
//     await User.findByIdAndUpdate(req.user._id, {
//       $addToSet: { classrooms: classroom._id },
//     });
//     res.status(201).json(classroom);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ----------------get single classroom ---------------------------
// router.get("/:id", auth, async (req, res) => {
//   try {
//     const classroom = await Classroom.findById(req.params.id).populate(
//       "teachers.user students classRep",
//       "-password",
//     );
//     if (!classroom)
//       return res.status(404).json({ message: "Classroom not found" });
//     res.json(classroom);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // --------------post join classroom by invite code (student)------------------------
// router.post(
//   "/join",
//   auth,
//   authorize("student", "class_rep"),
//   async (req, res) => {
//     try {
//       const { inviteCode } = req.body;
//       const classroom = await Classroom.findOne({ inviteCode });
//       if (!classroom)
//         return res.status(404).json({ message: "Invalid invite code" });
//       if (classroom.students.includes(req.user._id)) {
//         return res.status(400).json({ message: "Already a member" });
//       }
//       classroom.students.push(req.user._id);
//       await classroom.save();
//       await User.findByIdAndUpdate(req.user._id, {
//         $addToSet: { classrooms: classroom._id },
//       });
//       res.json(classroom);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   },
// );

// // ----------------POST add teacher to classroom---------------------------
// router.post(
//   "/:id/add-teacher",
//   auth,
//   authorize("teacher", "admin"),
//   async (req, res) => {
//     try {
//       const classroom = await Classroom.findById(req.params.id);
//       if (!classroom)
//         return res.status(404).json({ message: "Classroom not found" });
//       const { teacherId } = req.body;
//       const alreadyIn = classroom.teachers.some(
//         (t) => t.user.toString() === teacherId,
//       );
//       if (alreadyIn)
//         return res
//           .status(400)
//           .json({ message: "Teacher already in classroom" });
//       classroom.teachers.push({ user: teacherId });
//       await classroom.save();
//       await User.findByIdAndUpdate(teacherId, {
//         $addToSet: { classrooms: classroom._id },
//       });
//       res.json(classroom);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   },
// );

// // --------------------put set class rep--------------------------
// router.put(
//   "/:id/set-class-rep",
//   auth,
//   authorize("teacher", "admin"),
//   async (req, res) => {
//     try {
//       const classroom = await Classroom.findById(req.params.id);
//       if (!classroom)
//         return res.status(404).json({ message: "Classroom not found" });
//       const { studentId } = req.body;
//       classroom.classRep = studentId;
//       await classroom.save();
//       // Update user role
//       await User.findByIdAndUpdate(studentId, { role: "class_rep" });
//       res.json(classroom);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   },
// );

// // --------------------get classroom members--------------------------
// router.get("/:id/members", auth, async (req, res) => {
//   try {
//     const classroom = await Classroom.findById(req.params.id).populate(
//       "students teachers.user classRep",
//       "-password",
//     );
//     if (!classroom)
//       return res.status(404).json({ message: "Classroom not found" });
//     res.json({
//       students: classroom.students,
//       teachers: classroom.teachers,
//       classRep: classroom.classRep,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // -------------------------DELETE remove student-----------------
// router.delete(
//   "/:id/remove-student/:studentId",
//   auth,
//   authorize("teacher", "admin", "class_rep"),
//   async (req, res) => {
//     try {
//       const classroom = await Classroom.findByIdAndUpdate(
//         req.params.id,
//         { $pull: { students: req.params.studentId } },
//         { new: true },
//       );
//       await User.findByIdAndUpdate(req.params.studentId, {
//         $pull: { classrooms: req.params.id },
//       });
//       res.json(classroom);
//     } catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   },
// );

// module.exports = router;
