const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/Auth");
const chatController = require("../controllers/chatController");

router.get("/contacts", auth, chatController.getContacts);
router.get("/messages", auth, chatController.getMessages);
router.post("/message", auth, chatController.sendMessage);

module.exports = router;