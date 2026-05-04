const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, authorize } = require("../middleware/Auth");
const multer = require('multer');
const { uploadAvatar } = require('../controllers/userController');



const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }, // 1 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed!'), false);
    }
  }
});


// GET all users (admin only)
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const { role, department } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    const users = await User.find(filter).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/teachers - get all teachers
router.get("/teachers", auth, async (req, res) => {
  try {
    const teachers = await User.find({
      role: { $in: ["teacher", "admin"] },
    }).select("-password");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/role - admin changes user role
router.put(
  "/:id/role",
  auth,
  authorize("admin", "teacher"),
  async (req, res) => {
    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true },
      ).select("-password");
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);



// @desc    Update User App Settings
// @route   PUT /api/users/settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { appSettings } = req.body;
    
    // Update the authenticated user's settings field
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: { appSettings } }, 
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, appSettings: user.appSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.put('/profile/avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;
