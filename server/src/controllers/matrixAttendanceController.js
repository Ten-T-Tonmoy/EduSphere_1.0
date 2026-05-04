const mongoose = require('mongoose');
const GroupAttendance = require("../models/GroupAttendance");
const User = require("../models/User");
const Group = require("../models/Group");
const Notify = require('../services/NotificationManager');

exports.getInteractiveMatrix = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { courseId } = req.query;
    
    if (!courseId) return res.status(400).json({ success: false, message: 'Course ID is required' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const members = await User.find({
      _id: { $in: group.members.map(m => m.user) },
      role: { $in: ['student', 'cr'] } 
    }).select('_id name email studentId');

    members.sort((a, b) => {
      const numA = parseInt(a.studentId?.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.studentId?.replace(/\D/g, '')) || 0;
      return numA - numB || (a.studentId || '').localeCompare(b.studentId || '');
    });

    // FIX: Removed manual ObjectId casting to prevent empty array returns if types mismatch
    const records = await GroupAttendance.find({ 
       group: groupId,
       course: courseId 
    }).sort({ date: 1 });

    const activeSessionsMap = new Map();
    
    records.forEach(r => {
        const d = new Date(r.date);
        const sessionIndex = d.getUTCHours() || 1;
        const dateStr = d.toISOString().split('T')[0];
        const dKey = `${dateStr}_S${sessionIndex}`;
        
        if (!activeSessionsMap.has(dKey)) {
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

exports.getCourseMatrix = async (req, res) => {
  try {
    const { groupId, courseId } = req.query;
    if (!groupId || !courseId) return res.status(400).json({ message: "Group and Course are required." });

    const students = await User.find({ "groups.group": groupId, role: "student" })
      .select("name _id studentId email")
      .sort({ studentId: 1, name: 1 });

    const sessions = await GroupAttendance.find({ group: groupId, course: courseId }).sort({ date: 1 });

    const matrix = {};
    const sessionList = [];

    students.forEach(st => {
       matrix[st._id] = { id: st._id, studentId: st.studentId || st.email?.split('@')[0] || "N/A", name: st.name, records: {} };
    });

    sessions.forEach(session => {
      const d = new Date(session.date || session.createdAt);
      const displayDate = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCFullYear()).slice(-2)}`;
      sessionList.push({ id: session._id.toString(), display: displayDate, date: session.date || session.createdAt });

      if (session.records && Array.isArray(session.records)) {
          session.records.forEach(rec => {
              const sid = rec.student._id ? rec.student._id.toString() : rec.student.toString();
              if (matrix[sid]) matrix[sid].records[session._id.toString()] = rec.status;
          });
      } else if (session.student) {
          const sid = session.student._id ? session.student._id.toString() : session.student.toString();
          if (matrix[sid]) matrix[sid].records[session._id.toString()] = session.status;
      }
    });

    res.json({ sessionList, students: Object.values(matrix) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportMatrixToDocs = async (req, res) => {
  let responseSent = false;
  try {
    const { groupId } = req.params;
    const { courseId, courseName } = req.query;

    if (!courseId) {
      responseSent = true;
      return res.status(400).json({ success: false, message: 'Course ID required' });
    }

    const group = await Group.findById(groupId);
    const records = await GroupAttendance.find({ 
       group: groupId,
       course: courseId 
     }).sort({ date: 1 });

    const members = await User.find({
      _id: { $in: group.members.map(m => m.user) },
      role: { $in: ['student', 'cr'] }
    }).select('name studentId');

    members.sort((a, b) => (parseInt(a.studentId) || 0) - (parseInt(b.studentId) || 0));

    const uniqueSessionsMap = new Map();
    records.forEach(r => {
        const d = new Date(r.date);
        const sessionIndex = d.getUTCHours() || 1;
        const dateStr = d.toISOString().split('T')[0];
        const dKey = `${dateStr}_S${sessionIndex}`;
        
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(d.getUTCFullYear()).slice(-2);

        uniqueSessionsMap.set(dKey, {
            key: dKey,
            dateStr: dateStr,
            sessionIndex: sessionIndex,
            display: `${dd}/${mm}/${yy} (C${sessionIndex})`
        });
    });
    
    const sortedSessions = Array.from(uniqueSessionsMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    
    const headers = ["ID Node", "Full Name", ...sortedSessions.map(s => s.display)];

    const rows = members.map(member => {
      const rowData = [member.studentId || "N/A", member.name];
      sortedSessions.forEach(session => {
        const record = records.find(r => {
            const d = new Date(r.date);
            const sIdx = d.getUTCHours() || 1;
            const k = `${d.toISOString().split('T')[0]}_S${sIdx}`;
            return r.student.toString() === member._id.toString() && k === session.key;
        });
        rowData.push(record ? (record.status === 'present' || record.status === 'attended' ? 'P' : 'A') : "-");
      });
      return rowData;
    });

    res.json({
      success: true,
      message: "Exporting data... Check your notifications.",
      documentTitle: `Attendance: ${courseName} - ${group.name}`,
      tableData: { headers, rows }
    });
    responseSent = true;

    await Notify.send({
      recipientId: req.user._id,
      type: 'DOC_READY',
      title: 'Google Doc Export',
      message: `Your report for ${courseName} is prepared.`,
      payload: { courseId },
      actions: ['VIEW']
    });

  } catch (error) {
    console.error("Export Error:", error.message);
    if (!responseSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};