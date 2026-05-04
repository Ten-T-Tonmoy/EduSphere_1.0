const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // CHANGED: renamed 'teacher' to 'createdBy' to match project standards
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide note content'],
    maxlength: [50000, 'Content too long']
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);