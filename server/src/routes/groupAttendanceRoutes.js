const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/Auth'); // Uses your project's Auth
const ctrl = require('../controllers/groupAttendanceController');

router.use(auth);

router.get('/courses/:groupId', ctrl.getGroupCourses);
router.get('/group/:groupId', ctrl.getGroupAttendance);
router.post('/mark', ctrl.markAttendance);
router.get('/export/:groupId', ctrl.exportAttendance);
router.get('/student/:groupId', ctrl.getStudentAttendance);
router.get('/today', ctrl.getTodayAttendance);
router.post('/', ctrl.markTeacherAttendance);

module.exports = router;