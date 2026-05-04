const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topics: [topicSchema],
  isCompleted: { type: Boolean, default: false },
});

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    // CHANGED: Now references Group
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    semester: { type: Number, required: true },
    credits: { type: Number, default: 3 },
    chapters: [chapterSchema],
    classStartDate: { type: Date },
    classEndDate: { type: Date },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Course || mongoose.model("Course", courseSchema);
