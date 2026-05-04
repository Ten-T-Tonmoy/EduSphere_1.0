const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    unique: true,
    maxlength: [50, 'Group name cannot be more than 50 characters']
  },
  pin: {
    type: String,
    required: [true, 'Please provide a group PIN'],
    minlength: 4,
    maxlength: 10
  },
  description: {
    type: String,
    maxlength: 200
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'cr', 'admin'],
      default: 'student'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Bottom line should be:
module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);