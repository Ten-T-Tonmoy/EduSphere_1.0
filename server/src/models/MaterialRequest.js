const mongoose = require("mongoose");

const materialRequestSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Null means asking everyone in the group
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MaterialRequest || mongoose.model("MaterialRequest", materialRequestSchema);