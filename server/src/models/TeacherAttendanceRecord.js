const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Adjusted to User model
  date: { type: Date, required: true },
  attended: { type: Boolean, required: true },
  isSpecial: { type: Boolean, default: false },
  notes: { type: String, maxlength: 200 },
  createdAt: { type: Date, default: Date.now }
});

recordSchema.index({ user: 1, teacher: 1, date: 1 }, { unique: true });

// Defensive export
module.exports = mongoose.models.TeacherAttendanceRecord || mongoose.model('TeacherAttendanceRecord', recordSchema);