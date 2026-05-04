const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const { auth } = require("../middleware/Auth");

router.get("/", auth, async (req, res) => {
  try {
    const { month, year, category, type } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/summary", auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { user: req.user._id };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }
    const result = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          total: { $sum: "$amount" },
        },
      },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user._id });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true },
    );
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
