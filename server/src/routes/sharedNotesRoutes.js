const express = require("express");
const router = express.Router();
const multer = require("multer");
const { auth } = require("../middleware/Auth");
const sharedNotesController = require("../controllers/sharedNotesController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, 
});

router.get("/shared", auth, sharedNotesController.getSharedMaterials);
router.post("/share", auth, upload.array("attachments", 10), sharedNotesController.shareMaterial);

// NEW: Route to track views
router.post("/shared/:id/view", auth, sharedNotesController.markAsViewed);

router.get("/requests", auth, sharedNotesController.getRequests);
router.post("/requests", auth, sharedNotesController.createRequest);

module.exports = router;