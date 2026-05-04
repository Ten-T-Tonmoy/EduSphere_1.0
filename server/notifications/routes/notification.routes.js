const express = require("express");
const router = express.Router();
const { saveToken, removeToken, getLogs, markAsRead } = require("../controllers/notification.controller");
const { auth } = require("../../src/middleware/Auth"); 

router.post("/save-token", auth, saveToken);
router.post("/remove-token", auth, removeToken);
router.get("/logs", auth, getLogs);           // NEW
router.put("/read", auth, markAsRead);

module.exports = router;