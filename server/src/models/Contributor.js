const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  photo: { type: String, required: true }, // Image URL
  contributions: [{ type: String }],
  github: String,
  linkedin: String,
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Contributor || mongoose.model('Contributor', contributorSchema);