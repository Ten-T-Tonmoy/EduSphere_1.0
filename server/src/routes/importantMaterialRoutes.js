const express = require("express");
const router = express.Router();
const multer = require("multer");
const { auth } = require("../middleware/Auth");
const importantMaterialController = require("../controllers/importantMaterialController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for rich materials
});

router.get("/group/:groupId", auth, importantMaterialController.getGroupMaterials);
router.post("/", auth, upload.array("attachments", 10), importantMaterialController.createMaterial);
router.post("/:id/view", auth, importantMaterialController.markAsViewed);
router.delete("/:id", auth, importantMaterialController.deleteMaterial);

module.exports = router;