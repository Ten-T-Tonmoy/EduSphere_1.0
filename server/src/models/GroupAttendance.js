const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Connected to Group feature
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // ADDED: Missing course field to resolve the "Cannot populate path course" error
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  // Updated to include 'late' to match your matrix functionality
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ group: 1, student: 1, date: 1, course: 1 }, { unique: true });

module.exports = mongoose.models.GroupAttendance || mongoose.model('GroupAttendance', attendanceSchema);