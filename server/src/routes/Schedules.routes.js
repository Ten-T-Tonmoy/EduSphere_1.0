const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/Auth"); // Added authorize
const scheduleController = require("../controllers/schedeule.controller");

// ==================== GET Routes (Read-Only for all logged-in users) ====================

router.get("/classroom/:classroomId", auth, scheduleController.getClassroomSchedule);
router.get("/teacher", auth, scheduleController.getTeacherSchedule);
router.get("/student", auth, scheduleController.getStudentSchedule);
router.get("/department/:department", auth, scheduleController.getDepartmentSchedule);
router.get("/empty-slots", auth, scheduleController.getEmptySlots);
router.get("/extra-class-requests", auth, scheduleController.getExtraClassRequests);
router.get("/extra-class-requests/:classroomId", auth, scheduleController.getClassroomExtraRequests);

// ==================== POST Routes (Managers Only) ====================

// Create a new class slot (CRs, Teachers, Admins)
router.post("/", auth, authorize("admin", "class_rep", "teacher"), scheduleController.createSlot);

// Cancel a specific slot (CRs, Teachers, Admins)
router.post("/:id/cancel", auth, authorize("admin", "class_rep", "teacher"), scheduleController.cancelSlot);

// Request an extra class (CRs, Teachers, Admins)
router.post("/extra-class-request", auth, authorize("admin", "class_rep", "teacher"), scheduleController.createExtraClassRequest);

// ==================== PUT Routes ====================

// Update a slot (CRs, Teachers, Admins)
router.put("/:id", auth, authorize("admin", "class_rep", "teacher"), scheduleController.updateSlot);

// Approve or reject extra class request (CR AND ADMIN ONLY - Teachers cannot approve)
router.put(
  "/extra-class-request/:id",
  auth,
  authorize("admin", "class_rep"),
  scheduleController.reviewExtraClassRequest
);

// ==================== DELETE Routes ====================

// Delete a slot (CRs, Teachers, Admins)
router.delete("/:id", auth, authorize("admin", "class_rep", "teacher"), scheduleController.deleteSlot);

// Undo a cancellation / remove override (CRs, Teachers, Admins)
router.delete("/:id/cancel", auth, authorize("admin", "class_rep", "teacher"), scheduleController.undoCancellation);

module.exports = router;