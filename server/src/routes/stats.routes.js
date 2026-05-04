const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/Auth");

const Attendance = require("../models/GroupAttendance");
const Expense = require("../models/Expense");
const Task = require("../models/Task");
const Note = require("../models/Note"); 
const Message = require("../models/Message");
const Notice = require("../models/Notice");
const Course = require("../models/Course");
const Group = require("../models/Group");

//--------------------auth ----------------------------------------

function guardSelf(req, res, next) {
  if (req.user._id.toString() !== req.params.userId && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

//  ---------- GET /api/stats/:userId ---------------------------------------

router.get("/:userId", auth, guardSelf, async (req, res) => {
  try {
    const uid = req.params.userId;

    // Querying groups where the user is a member
    const groups = await Group.find(
      { "members.user": uid },
      "_id name",
    ).lean();
    
    const groupIds = groups.map((g) => g._id);

    //------------------------parallel------------
    const [attendance, expenses, tasks, notes, messages, notices, courses] =
      await Promise.all([
        Attendance.find({ student: uid })
          .populate("course", "name code")
          .select("course date status createdAt")
          .lean(),

        Expense.find({ user: uid })
          .select("amount category date createdAt type")
          .lean(),

        Task.find({ user: uid })
          .populate("relatedCourse", "name code")
          .select("relatedCourse status title dueDate completed createdAt updatedAt")
          .lean(),

        Note.find({ $or: [{ user: uid }, { sharedWith: uid }] })
          .populate("createdBy", "name")
          .select("createdBy content attachments createdAt")
          .lean(),

        Message.find({ sender: uid }).select("group createdAt").lean(),

        // Using 'group' field to fetch notices relevant to the user's groups
        Notice.find({ group: { $in: groupIds } })
          .select("group createdAt")
          .lean(),

        // Using 'group' field to fetch courses relevant to the user's groups
        Course.find({ group: { $in: groupIds } })
          .select("name code group")
          .lean(),
      ]);

    res.json({
      success: true,
      data: {
        attendance,
        expenses,
        tasks,
        notes, 
        materials: [],
        messages,
        notices,
        courses,
        groups,
      },
    });
  } catch (err) {
    console.error("[stats]", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;