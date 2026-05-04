const NotificationToken = require("../models/NotificationToken");
const NotificationLog = require("../models/NotificationLog");

exports.saveToken = async (req, res) => {
  try {
    const { token, deviceType } = req.body;
    const userId = req.user._id; // Relies on your existing Auth middleware

    await NotificationToken.findOneAndUpdate(
      { token },
      { user: userId, deviceType, token },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Token registered" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.removeToken = async (req, res) => {
  try {
    const { token } = req.body;
    await NotificationToken.findOneAndDelete({ token });
    res.status(200).json({ success: true, message: "Token removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



// Replace your existing getLogs function with this:
exports.getLogs = async (req, res) => {
  try {
    const logs = await NotificationLog.find({ recipient: req.user._id })
      .populate('sender', 'name avatar') // ✅ Populates the sender's avatar
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await NotificationLog.countDocuments({ recipient: req.user._id, isRead: false });
    res.status(200).json({ success: true, logs, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// NEW: Mark notifications as read
exports.markAsRead = async (req, res) => {
  try {
    await NotificationLog.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};