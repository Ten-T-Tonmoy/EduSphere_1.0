const express = require("express");
const router = express.Router();
const AcademicCalendar = require("../models/Academiccalender.js");
const { auth, authorize } = require("../middleware/Auth");

router.get("/classroom/:classroomId", auth, async (req, res) => {
  try {
    const calendars = await AcademicCalendar.find({
      classroom: req.params.classroomId,
    }).populate("createdBy", "name");
    res.json(calendars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  "/",
  auth,
  authorize("teacher", "admin", "class_rep"),
  async (req, res) => {
    try {
      const cal = await AcademicCalendar.create({
        ...req.body,
        createdBy: req.user._id,
      });
      res.status(201).json(cal);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.put(
  "/:id",
  auth,
  authorize("teacher", "admin", "class_rep"),
  async (req, res) => {
    try {
      const cal = await AcademicCalendar.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );
      res.json(cal);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.post(
  "/:id/event",
  auth,
  authorize("teacher", "admin", "class_rep"),
  async (req, res) => {
    try {
      const cal = await AcademicCalendar.findByIdAndUpdate(
        req.params.id,
        { $push: { events: req.body } },
        { new: true },
      );
      res.json(cal);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.delete(
  "/:id/event/:eventId",
  auth,
  authorize("teacher", "admin", "class_rep"),
  async (req, res) => {
    try {
      const cal = await AcademicCalendar.findByIdAndUpdate(
        req.params.id,
        { $pull: { events: { _id: req.params.eventId } } },
        { new: true },
      );
      res.json(cal);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

module.exports = router;
