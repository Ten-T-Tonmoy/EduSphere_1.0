const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    category: { type: String, default: "general" },
    tags: [{ type: String }],
    relatedCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
