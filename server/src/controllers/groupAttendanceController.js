const GroupAttendance = require('../models/GroupAttendance');
const TeacherAttendanceRecord = require('../models/TeacherAttendanceRecord');
const Group = require('../models/Group');
const User = require('../models/User');
const Course = require('../models/Course');

exports.getGroupCourses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const courses = await Course.find({ group: groupId, isActive: true }).populate('teacher', 'name');
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroupAttendance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { courseId } = req.query; // Removed month/year 
          
    if (!courseId) {
        return res.status(400).json({ success: false, message: 'Course is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const members = await User.find({
      _id: { $in: group.members.map(m => m.user) },
      role: { $in: ['student', 'cr'] } 
     }).select('_id name email studentId');

    members.sort((a, b) => {
      const numA = parseInt(a.studentId?.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.studentId?.replace(/\D/g, '')) || 0;
      if (numA && numB) return numA - numB;
      return (a.studentId || '').localeCompare(b.studentId || '');
    });

    // Fetch ALL active records for the course 
    const records = await GroupAttendance.find({
      group: groupId,
      course: courseId
    }).sort({ date: 1 });

    // Identify unique active sessions (Date + Sub-cell index).
    // This perfectly hides empty columns because it ONLY pushes dates with an active record from DB.
    const activeSessionsMap = new Map();
    records.forEach(r => {
        const d = new Date(r.date);
        const sessionIndex = d.getUTCHours() || 1;
        const dateStr = d.toISOString().split('T')[0];
        const dKey = `${dateStr}_S${sessionIndex}`;
        
        if (!activeSessionsMap.has(dKey)) {
            // Convert to DD/MM/YY Format for the Frontend Matrix Header
            const dd = String(d.getUTCDate()).padStart(2, '0');
            const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
            const yy = String(d.getUTCFullYear()).slice(-2);

            activeSessionsMap.set(dKey, {
                key: dKey,
                dateStr: dateStr,
                sessionIndex: sessionIndex,
                display: `${dd}/${mm}/${yy} (C${sessionIndex})`
            });
        }
    });

    const activeSessions = Array.from(activeSessionsMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    const attendanceData = members.map(member => {
      const studentAttendance = {};
      
      // Map records to specific session keys
      records.forEach(r => {
        if (r.student.toString() === member._id.toString()) {
          const d = new Date(r.date);
          const sessionIndex = d.getUTCHours() || 1;
          const dKey = `${d.toISOString().split('T')[0]}_S${sessionIndex}`;
          studentAttendance[dKey] = r.status;
        }
      });

      return {
        studentId: member._id,
        studentNumber: member.studentId,
        name: member.name,
        attendance: studentAttendance
      };
    });

    res.json({ 
        success: true, 
        data: attendanceData, 
        activeSessions: activeSessions 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { groupId, studentId, date, status, courseId, sessionIndex = 1 } = req.body;
    const userId = req.user._id.toString();

    if (!courseId) return res.status(400).json({ success: false, message: 'Course ID is required' });

    const group = await Group.findById(groupId);
    
    const isGlobalAuth = ['teacher', 'admin'].includes(req.user.role);
    const groupMember = group.members.find(m => m.user.toString() === userId);
    const isLocalAuth = groupMember && ['teacher', 'admin'].includes(groupMember.role);

    if (!isGlobalAuth && !isLocalAuth) {
      return res.status(403).json({ success: false, message: 'Only Teachers and Admins can mark attendance.' });
    }

    // Assign session as UTC Hours, isolating the session index across the DB safely
    const inputDate = new Date(date + "T00:00:00Z");
    inputDate.setUTCHours(sessionIndex, 0, 0, 0);
    
    // If status is empty (toggle off), remove from DB completely. 
    // This allows the column to auto-hide the next day if NO ONE has attendance marked!
    if (!status || status === "") {
        await GroupAttendance.findOneAndDelete({ group: groupId, student: studentId, date: inputDate, course: courseId });
        return res.json({ success: true, message: "Cleared" });
    }

    const attendance = await GroupAttendance.findOneAndUpdate(
      { group: groupId, student: studentId, date: inputDate, course: courseId },
      { status, markedBy: userId },
      { upsert: true, new: true }
    );

    const io = req.app.get('io');
    if (io) io.to(`classroom_${groupId}`).emit('attendance-updated', { groupId, courseId, date: inputDate });

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... keep existing exportAttendance, getStudentAttendance, getTodayAttendance, markTeacherAttendance below
exports.exportAttendance = async (req, res) => {
  res.json({ success: true, message: 'Export endpoint' });
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, year } = req.query;
    const userId = req.user._id.toString();
    
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });
    
    const group = await Group.findById(groupId).populate({ path: 'members.user', select: 'name email role' });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    const isMember = group.members.some(m => m.user._id.toString() === userId);
    if (!isMember) return res.status(403).json({ success: false, message: 'You are not a member of this group' });

    const teachers = group.members.filter(m => m.role === 'teacher').map(m => ({ id: m.user._id, name: m.user.name }));
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const daysInMonth = endDate.getDate();
    
    const records = await TeacherAttendanceRecord.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('teacher', 'name');

    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d);
      const dayRecords = teachers.map(teacher => {
        const record = records.find(r => r.teacher._id.toString() === teacher.id.toString() && r.date.toDateString() === dayDate.toDateString());
        return { teacherId: teacher.id, teacherName: teacher.name, status: record ? (record.attended ? 'present' : 'absent') : null };
      });
      data.push({ day: d, records: dayRecords });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  res.json({ success: true, teachers: [] }); 
};

exports.markTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, attended, isSpecial, date } = req.body;
    const userId = req.user._id;

    if (!teacherId || attended === undefined) return res.status(400).json({ success: false, message: 'teacherId and attended are required' });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const record = await TeacherAttendanceRecord.findOneAndUpdate(
      { user: userId, teacher: teacherId, date: targetDate },
      { attended, isSpecial: isSpecial || false },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};