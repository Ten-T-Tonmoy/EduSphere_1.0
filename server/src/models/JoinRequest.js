const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  groupName: {
    type: String,
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['student', 'teacher', 'cr'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
});

joinRequestSchema.index({ user: 1, group: 1, status: 1 }, { unique: true });

// Bottom line should be:
module.exports = mongoose.models.JoinRequest || mongoose.model('JoinRequest', joinRequestSchema);