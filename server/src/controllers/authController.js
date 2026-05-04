// controllers/authController.js (You can add this or put it in routes if preferred)
const crypto = require('crypto');
const User = require('../models/User');

// @desc    Request Password Reset
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user with that email exists." });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (e.g., 10 minutes)
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL (Adjust frontend URL as needed)
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // For now, we log it to console. You can integrate Nodemailer here.
    console.log(`Password reset link: ${resetUrl}`);

    res.status(200).json({ 
      success: true, 
      message: "Email sent (Check console for link during development)" 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reset Password using Token
// @route   PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // Set new password (the .pre('save') hook will hash this)
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};