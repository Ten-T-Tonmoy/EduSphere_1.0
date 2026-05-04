const Expense = require("../models/Expense");
const Classroom = require("../models/Classroom");

// ==================== GET Controllers ====================

// ------------- Get all expenses (with filters) -------------
exports.getAllExpenses = async (req, res) => {
  try {
    const { classroom, category, startDate, endDate, limit } = req.query;
    let filter = {};

    if (classroom) filter.classroom = classroom;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    let query = Expense.find(filter)
      .populate("createdBy", "name email")
      .populate("classroom", "name department year")
      .sort({ date: -1, createdAt: -1 });

    if (limit) query = query.limit(parseInt(limit));

    const expenses = await query;
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------- Get single expense by ID -------------
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("classroom", "name department year");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------- Get expenses for a specific classroom -------------
exports.getClassroomExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ classroom: req.params.classroomId })
      .populate("createdBy", "name email")
      .populate("classroom", "name department year")
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------- Get expense summary/stats -------------
exports.getExpenseSummary = async (req, res) => {
  try {
    const { classroom, year, month } = req.query;
    let filter = {};

    if (classroom) filter.classroom = classroom;

    // Date filtering
    if (year || month) {
      filter.date = {};
      const startDate = new Date();
      const endDate = new Date();

      if (year && month) {
        // Specific month of a year
        startDate.setFullYear(parseInt(year), parseInt(month) - 1, 1);
        endDate.setFullYear(parseInt(year), parseInt(month), 0);
      } else if (year) {
        // Whole year
        startDate.setFullYear(parseInt(year), 0, 1);
        endDate.setFullYear(parseInt(year), 11, 31);
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      filter.date.$gte = startDate;
      filter.date.$lte = endDate;
    }

    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
        },
      },
    ]);

    // Category-wise breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({
      summary: summary[0] || { totalAmount: 0, count: 0 },
      categoryBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== POST Controllers ====================

// ------------- Create a new expense -------------
exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, description, date, classroom, receipt } =
      req.body;

    // Validate required fields
    if (!title || !amount || !category) {
      return res
        .status(400)
        .json({ message: "Title, amount, and category are required" });
    }
    //-------------shall delete?----
    let receiptData = null;
    if (receipt) {
      receiptData = {
        url: receipt.url || receipt,
        publicId: receipt.publicId || null,
      };
    }
    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount,
      category: category || "other",
      type,
      date: date || Date.now(),
      note: note || "",
      receipt: receiptData,
    });

    await expense.populate([
      { path: "createdBy", select: "name email" },
      // { path: "classroom", select: "name department year" },
    ]);

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== PUT Controllers ====================

// ------------- Update an expense -------------
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if user has permission (admin or creator)
    if (
      req.user.role !== "admin" &&
      expense.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this expense" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate("createdBy", "name email")
      .populate("classroom", "name department year");

    res.json(updatedExpense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== DELETE Controllers ====================

// ------------- Delete an expense -------------
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if user has permission (admin or creator)
    if (
      req.user.role !== "admin" &&
      expense.createdBy.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this expense" });
    }

    await expense.deleteOne();
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------- Delete multiple expenses -------------
exports.deleteMultipleExpenses = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide an array of expense IDs" });
    }

    // If not admin, only delete expenses created by user
    let filter = { _id: { $in: ids } };
    if (req.user.role !== "admin") {
      filter.createdBy = req.user._id;
    }

    const result = await Expense.deleteMany(filter);

    res.json({
      message: `${result.deletedCount} expense(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
