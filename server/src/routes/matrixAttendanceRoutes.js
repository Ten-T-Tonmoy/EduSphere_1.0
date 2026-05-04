const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/Auth");
const ctrl = require("../controllers/matrixAttendanceController");

router.use(auth);

// Dedicated route for the Interactive Matrix (Semester View)
router.get('/:groupId', ctrl.getInteractiveMatrix);

// Endpoint: /api/matrix-attendance/course
router.get("/course", ctrl.getCourseMatrix);

router.get('/export/:groupId', auth, ctrl.exportMatrixToDocs);

module.exports = router;