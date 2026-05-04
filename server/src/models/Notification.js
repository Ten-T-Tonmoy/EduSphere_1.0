const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['ATTENDANCE_ALERT', 'GROUP_REQUEST', 'DOC_READY', 'SYSTEM_NOTICE'],
    required: true 
  },
  title: String,
  message: String,
  payload: {
    groupId: mongoose.Schema.Types.ObjectId,
    courseId: mongoose.Schema.Types.ObjectId,
    link: String
  },
  actions: [String], // e.g., ["VIEW", "APPROVE"]
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);