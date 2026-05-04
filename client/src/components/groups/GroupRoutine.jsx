import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import { useAuth } from '../../context/Authcontext';
import UniLifeLoader from '../Loader/UniLifeLoader';

// Time slots aligned with SchedulePage
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

// Aligned with standard 0-6 (Sunday-Saturday) index used in ClassSlot model
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GroupRoutine = ({ groupId, groupName, onClose }) => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]); // Added to select actual courses
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null); 
  const [formData, setFormData] = useState({
    teacherId: '',
    courseId: '', // Changed from subject to courseId
    startTime: '',
    endTime: '',
    room: '',
    type: 'lecture'
  });

  const isAdminOrCR = user?.role === 'admin' || user?.role === 'cr' || user?.role === 'class_rep';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Connecting to the same endpoints used by SchedulePage
      const [routineRes, teachersRes, coursesRes] = await Promise.all([
        api.get(`/schedules/classroom/${groupId}`), 
        api.get(`/users/teachers`),
        api.get(`/syllabus/group/${groupId}`)
      ]);
      setRoutines(routineRes.data);
      setTeachers(teachersRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (dayIndex, startTime) => {
    const existing = routines.find(r => r.dayOfWeek === dayIndex && r.startTime === startTime);
    if (existing) {
      setFormData({
        teacherId: existing.teacher?._id || '',
        courseId: existing.course?._id || '',
        startTime: existing.startTime,
        endTime: existing.endTime,
        room: existing.room || '',
        type: existing.isLab ? 'lab' : 'lecture'
      });
    } else {
      const index = TIME_SLOTS.indexOf(startTime);
      const defaultEnd = TIME_SLOTS[index + 1] || startTime;
      setFormData({
        teacherId: '',
        courseId: '',
        startTime,
        endTime: defaultEnd,
        room: '',
        type: 'lecture'
      });
    }
    setSelectedCell({ dayIndex, startTime, existing });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.courseId) {
      alert('Please select a course');
      return;
    }
    try {
      // Using the /schedules POST logic
      const payload = {
        group: groupId,
        course: formData.courseId,
        teacher: formData.type === 'lecture' ? formData.teacherId : undefined,
        teachers: formData.type === 'lab' ? [formData.teacherId] : [],
        dayOfWeek: selectedCell.dayIndex,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isLab: formData.type === 'lab',
        room: formData.room
      };

      if (selectedCell.existing) {
        await api.put(`/schedules/${selectedCell.existing._id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save schedule slot');
    }
  };

  const handleDelete = async (routineId) => {
    if (!window.confirm('Delete this class permanently from the routine?')) return;
    try {
      await api.delete(`/schedules/${routineId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getDurationInSlots = (start, end) => {
    const startIdx = TIME_SLOTS.indexOf(start);
    const endIdx = TIME_SLOTS.indexOf(end);
    return endIdx - startIdx;
  };

  const buildRowCells = (dayIndex) => {
    const cells = [];
    const coveredCells = new Set();
    
    // Predetermine covered cells for spans
    routines.filter(r => r.dayOfWeek === dayIndex).forEach(r => {
      const startIdx = TIME_SLOTS.indexOf(r.startTime);
      const duration = getDurationInSlots(r.startTime, r.endTime);
      for(let j = 1; j < duration; j++) {
        coveredCells.add(TIME_SLOTS[startIdx + j]);
      }
    });

    let i = 0;
    while (i < TIME_SLOTS.length) {
      const currentTime = TIME_SLOTS[i];
      if (coveredCells.has(currentTime)) {
        i++;
        continue;
      }

      const routine = routines.find(r => r.dayOfWeek === dayIndex && r.startTime === currentTime);
      if (routine) {
        const duration = getDurationInSlots(routine.startTime, routine.endTime);
        const colspan = duration > 0 ? duration : 1;
        const canEdit = isAdminOrCR || (isTeacher && routine.teacher?._id === user?._id);
        const isCancelled = routine.status === 'cancelled';

        cells.push(
          <td
            key={`${dayIndex}-${currentTime}`}
            colSpan={colspan}
            onClick={() => canEdit && handleCellClick(dayIndex, currentTime)}
            className={`border p-2 text-center cursor-pointer hover:bg-gray-100 transition-colors ${
              isCancelled ? 'bg-red-50 opacity-60' : routine.isLab ? 'bg-purple-100' : 'bg-blue-100'
            }`}
          >
            <div className="relative">
              <div className={`font-bold text-xs ${isCancelled ? 'line-through' : ''}`}>
                {routine.course?.name || 'Unknown Course'}
              </div>
              <div className="text-[10px] text-gray-600 font-medium">
                {routine.teacher?.name || routine.teachers?.[0]?.name}
              </div>
              {routine.room && <div className="text-[10px]">Rm: {routine.room}</div>}
              {isCancelled && <div className="text-[9px] text-red-600 font-bold uppercase">Cancelled</div>}
              {canEdit && !isCancelled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(routine._id);
                  }}
                  className="absolute -top-1 -right-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </td>
        );
        i += colspan;
      } else {
        cells.push(
          <td
            key={`${dayIndex}-${currentTime}`}
            onClick={() => isAdminOrCR && handleCellClick(dayIndex, currentTime)}
            className="border p-2 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          ></td>
        );
        i++;
      }
    }
    return cells;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-7xl h-[80vh] flex flex-col items-center justify-center border border-white">
          <UniLifeLoader size="1.2" />
          <div className="mt-8 flex flex-col items-center">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">UniLife Schedule</h3>
            <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] animate-pulse mt-2">
              Syncing Timetable...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col border border-white">
        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Group Routine</h2>
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest">{groupName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-gray-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-auto">
          <table className="w-full border-collapse border-spacing-0">
            <thead>
              <tr>
                <th className="border-b-2 border-r-2 p-4 bg-gray-100/50 text-xs font-black uppercase text-gray-400">Time</th>
                {TIME_SLOTS.map(time => (
                  <th key={time} className="border-b-2 border-r p-4 bg-gray-50 text-[10px] font-bold text-gray-500">{time}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, idx) => (
                <tr key={day} className="group">
                  <td className="border-r-2 border-b p-4 font-black text-sm text-gray-700 bg-gray-50/30 group-hover:bg-indigo-50 transition-colors">{day}</td>
                  {buildRowCells(idx)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50 border-t flex gap-6 text-xs font-bold uppercase tracking-tighter justify-center">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 rounded-sm border border-blue-200"></div> Lecture</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-100 rounded-sm border border-purple-200"></div> Lab</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-50 rounded-sm border border-red-200"></div> Temporary Cancellation</div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-white">
            <h3 className="text-2xl font-black mb-8 text-gray-900 tracking-tight">
              {selectedCell?.existing ? 'Modify Class Slot' : 'Add New Class'}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Course / Subject</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Assigned Teacher</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-5 py-4 bg-gray-50 border rounded-2xl font-bold outline-none"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Start Time</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold outline-none"
                  >
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">End Time</label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold outline-none"
                  >
                    {TIME_SLOTS.filter(t => t > formData.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold outline-none"
                    >
                        <option value="lecture">Lecture</option>
                        <option value="lab">Lab</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1">Room No.</label>
                    <input
                        type="text"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        placeholder="e.g. 402"
                        className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold outline-none"
                    />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={handleSave} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest">Confirm Slot</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupRoutine;