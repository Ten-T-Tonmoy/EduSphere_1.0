const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "food",
        "transport",
        "books",
        "fees",
        "accommodation",
        "entertainment",
        "health",
        "other",
      ],
      default: "other",
    },
    type: { type: String, enum: ["income", "expense"], required: true },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, default: "" },
    receipt: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
