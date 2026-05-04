const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const { auth } = require("../middleware/Auth");

// GET messages for a classroom (paginated)
router.get("/classroom/:classroomId", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const messages = await Message.find({
      classroom: req.params.classroomId,
      isDeleted: false,
    })
      .populate("sender", "name avatar role")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST send message
router.post("/", auth, async (req, res) => {
  try {
    const msg = await Message.create({ ...req.body, sender: req.user._id });
    const populated = await msg.populate("sender", "name avatar role");
    // Emit via socket
    const io = req.app.get("io");
    io.to(`classroom_${msg.classroom}`).emit("receive_message", populated);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE message (soft delete)
router.delete("/:id", auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Not found" });
    if (
      msg.sender.toString() !== req.user._id.toString() &&
      !["teacher", "admin"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    msg.isDeleted = true;
    msg.content = "This message was deleted";
    await msg.save();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
