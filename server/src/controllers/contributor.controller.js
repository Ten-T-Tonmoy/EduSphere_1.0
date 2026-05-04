// controllers/contributor.controller.js
const Contributor = require('../models/Contributor');

// Get all (Public)
exports.getContributors = async (req, res) => {
  try {
    const contributors = await Contributor.find().sort({ order: 1 });
    res.json({ success: true, data: contributors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create New (Admin)
exports.createContributor = async (req, res) => {
  try {
    const contributor = new Contributor(req.body);
    await contributor.save();
    res.status(201).json({ success: true, data: contributor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update Existing (Admin)
exports.updateContributor = async (req, res) => {
  try {
    const contributor = await Contributor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: contributor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete (Admin)
exports.deleteContributor = async (req, res) => {
  try {
    await Contributor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};