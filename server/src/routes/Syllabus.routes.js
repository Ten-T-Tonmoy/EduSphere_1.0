const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/Auth");
const courseController = require("../controllers/Syllabus.controller");

// ==================== GET Routes ====================

// Get all courses (with optional filters)
router.get("/", auth, courseController.getAllCourses);

// Get courses for a specific group
router.get("/group/:groupId", auth, courseController.getGroupCourses);

// Get courses for a specific classroom
router.get("/classroom/:classroomId", auth, courseController.getGroupCourses);

// Get course completion progress for a group
router.get("/group/:groupId/progress", auth, courseController.getGroupProgress);

// Get course completion progress for a classroom
router.get("/classroom/:classroomId/progress", auth, courseController.getGroupProgress);

// Get single course by ID
router.get("/:id", auth, courseController.getCourseById);

// ==================== POST Routes ====================

// Create new course (teachers, admins, class reps)
router.post(
  "/",
  auth,
  authorize("teacher", "admin", "class_rep"),
  courseController.createCourse,
);

// Add chapter to course
router.post(
  "/:courseId/chapters",
  auth,
  authorize("teacher", "admin"),
  courseController.addChapter,
);

// Add topic to chapter
router.post(
  "/:courseId/chapters/:chapterIdx/topics",
  auth,
  authorize("teacher", "admin"),
  courseController.addTopic,
);

// ==================== PUT Routes ====================

// Update course details
router.put(
  "/:id",
  auth,
  authorize("teacher", "admin", "class_rep"), courseController.updateCourse,
);

// Mark topic as complete/incomplete
router.put(
  "/:courseId/chapter/:chapterIdx/topic/:topicIdx/complete",
  auth,
  authorize("teacher", "admin", "class_rep"), courseController.toggleTopicCompletion,
);

// Reorder chapters
router.put(
  "/:courseId/reorder-chapters",
  auth,
  authorize("teacher", "admin"),
  courseController.reorderChapters,
);


router.put(
  "/group/:groupId/batch-update",
  auth,
  authorize("admin", "class_rep"),
  courseController.batchUpdateCourses
);

// ==================== DELETE Routes ====================

// Soft delete course (mark inactive)
router.delete(
  "/:id",
  auth,
  authorize("teacher", "admin", "class_rep"),
  courseController.deleteCourse,
);

// Hard delete course (admin only)
router.delete(
  "/:id/hard",
  auth,
  authorize("admin"),
  courseController.hardDeleteCourse,
);

// Delete chapter
router.delete(
  "/:courseId/chapters/:chapterIdx",
  auth,
  authorize("teacher", "admin"),
  courseController.deleteChapter,
);

// Delete topic
router.delete(
  "/:courseId/chapters/:chapterIdx/topics/:topicIdx",
  auth,
  authorize("teacher", "admin"),
  courseController.deleteTopic,
);

module.exports = router;