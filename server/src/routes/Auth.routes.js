const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { auth } = require("../middleware/Auth");

const {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../services/emailService");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, studentId, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. STRICT CHECK: Does Email exist?
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already registered. Please login or verify your account.",
      });
    }

    // 2. STRICT CHECK: Does Student ID exist? (Only check if ID is provided)
    if (studentId && (role === "student" || role === "class_rep")) {
      const existingID = await User.findOne({ studentId: studentId.trim() });
      if (existingID) {
        return res.status(400).json({
          success: false,
          message: "This Student ID is already linked to an account.",
        });
      }
    }

    // 3. Prepare verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 4. Create the user
    const newUser = await User.create({
      ...req.body,
      email: normalizedEmail,
      isVerified: false,
      verificationToken,
    });

    // 5. Try to send email
    try {
      await sendVerificationEmail(newUser.email, verificationToken);
      // We return a specific success message so the frontend knows NOT to go to dashboard
      return res.status(201).json({
        success: true,
        isVerificationRequired: true,
        message:
          "Verification email sent! Please check your inbox to activate your account.",
      });
    } catch (emailErr) {
      console.error("EMAIL ERROR:", emailErr.message);
      return res.status(201).json({
        success: true,
        isVerificationRequired: true,
        message:
          "Account created, but verification email failed. Please contact admin.",
      });
    }
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "System error. Please try again later.",
      });
  }
});

// GET /api/auth/verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.isVerified = true;
    user.verificationToken = undefined; // Clear token after use
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // CHECK VERIFICATION STATUS
    // if (!user.isVerified) {
    //   return res.status(401).json({ message: "Please verify your email before logging in." });
    // }

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/profile
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = [
      "name",
      "department",
      "studentId",
      "employeeId",
      "year",
      "semester",
      "avatar",
    ];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Step 1: Request Password Reset (Sends Email)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security, we don't tell the user if the email doesn't exist
    // to prevent "User Enumeration" attacks, but here we'll provide a clear msg for your UX.
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash and Save to DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 Minute Expiry
    await user.save();

    // Send the Email
    try {
      await sendResetPasswordEmail(user.email, resetToken);
      res.json({
        success: true,
        message: "Reset instructions sent to your inbox!",
      });
    } catch (emailErr) {
      res
        .status(500)
        .json({ message: "Failed to send email. Please try again later." });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// @desc    Step 2: Set New Password
router.put("/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.password; // pre-save hook handles hashing
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
