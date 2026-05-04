const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // ✅ ADDED SENDER
  title: { type: String, required: true },
  body: { type: String, required: true },
  actionUrl: { type: String, default: "/" },
  type: { type: String, enum: ["chat", "notice", "system"], default: "system" },
  priority: { type: String, enum: ["urgent", "high", "medium", "normal", "low"], default: "normal" },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);