const express = require('express');
const router = express.Router();
const Contributor = require('../models/Contributor');
const { auth } = require('../middleware/Auth');
const { getContributors } = require('../controllers/contributor.controller');

// Case-insensitive Super Admin Check
const superAdminOnly = (req, res, next) => {
  if (!req.user || !req.user.email || req.user.email.toLowerCase() !== "admin39326220@gmail.com") {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied: Only the Master Admin account can modify contributors." 
    });
  }
  next();
};

// Public: Everyone can view the elite squad
router.get('/', async (req, res) => {
  try {
    const data = await Contributor.find().sort({ order: 1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', getContributors);

// Restricted: Only admin39326220@gmail.com can add
router.post('/', auth, superAdminOnly, async (req, res) => {
  try {
    const contributor = await Contributor.create(req.body);
    res.status(201).json({ success: true, data: contributor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Restricted: Only admin3@gmail.com can delete
router.delete('/:id', auth, superAdminOnly, async (req, res) => {
  try {
    await Contributor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Contributor successfully removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;