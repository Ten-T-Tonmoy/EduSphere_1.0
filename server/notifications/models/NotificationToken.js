const mongoose = require("mongoose");

const notificationTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  deviceType: { type: String, default: "web" },
}, { timestamps: true });

module.exports = mongoose.model("NotificationToken", notificationTokenSchema);