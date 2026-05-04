const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { auth } = require("../middleware/Auth");

router.get("/", auth, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user._id });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true },
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
