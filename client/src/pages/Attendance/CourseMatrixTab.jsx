import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import { useAuth } from '../../context/Authcontext';
import { Table, Calendar } from 'lucide-react';
import UniLifeLoader from '../../components/Loader/UniLifeLoader';

const CourseMatrixTab = () => {
  const { user } = useAuth(); 
  const [myGroups, setMyGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ groupId: '', courseId: '' });
  const [matrixData, setMatrixData] = useState({ sessionList: [], students: [] });
  const [loading, setLoading] = useState(true);

  const canMark = ['teacher', 'admin', 'cr', 'class_rep'].includes(user?.role);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const groupsRes = await api.get('/groups/my-groups');
      const groups = groupsRes.data.groups?.map(g => g.group).filter(Boolean) || [];
      setMyGroups(groups);

      if (groups.length > 0) {
        const firstGroupId = groups[0]._id;
        // Fetch syllabus courses which include populated teacher data
        const courseRes = await api.get(`/syllabus/group/${firstGroupId}`);
        setCourses(courseRes.data || []);

        const today = new Date().toISOString().split('T')[0];
        const schedRes = await api.get(`/schedules/student?date=${today}`);

        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();

        let runningCourseId = null;
        if (schedRes.data && Array.isArray(schedRes.data)) {
          for (let slot of schedRes.data) {
            if (slot.startTime && slot.endTime) {
              const [sh, sm] = slot.startTime.split(':').map(Number);
              const [eh, em] = slot.endTime.split(':').map(Number);
              if (nowMins >= (sh * 60 + sm) && nowMins <= (eh * 60 + em)) {
                runningCourseId = slot.course?._id || slot.course;
                break;
              }
            }
          }
        }

        const defaultCourseId = runningCourseId || (courseRes.data.length > 0 ? courseRes.data[0]._id : null);
        setForm({ groupId: firstGroupId, courseId: defaultCourseId });
        if (defaultCourseId) fetchMatrix(firstGroupId, defaultCourseId);
      }
    } catch (err) {
      console.error("Failed to load matrix data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrix = async (groupId, courseId) => {
    if (!groupId || !courseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/matrix-attendance/course?groupId=${groupId}&courseId=${courseId}`);
      setMatrixData(res.data);
    } catch (err) {
      setMatrixData({ sessionList: [], students: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (studentId, session) => {
    if (!canMark) return;
    const currentStatus = matrixData.students.find(s => s.id === studentId)?.records[session.id] || null;
    const cycle = { null: 'present', 'present': 'absent', 'absent': 'late', 'late': null };
    const nextStatus = cycle[currentStatus];

    try {
      await api.post('/group-attendance/mark', {
        groupId: form.groupId,
        studentId: studentId,
        date: session.date,
        status: nextStatus
      });

      setMatrixData(prev => ({
        ...prev,
        students: prev.students.map(st => st.id === studentId ? {
          ...st,
          records: { ...st.records, [session.id]: nextStatus }
        } : st)
      }));
    } catch (err) {
      alert(err.response?.data?.message || "Error updating attendance");
    }
  };

  const handleGroupChange = async (e) => {
    const gId = e.target.value;
    setForm(prev => ({ ...prev, groupId: gId }));
    try {
      const courseRes = await api.get(`/syllabus/group/${gId}`);
      setCourses(courseRes.data || []);
      const firstCourse = courseRes.data.length > 0 ? courseRes.data[0]._id : '';
      setForm(prev => ({ ...prev, courseId: firstCourse }));
      fetchMatrix(gId, firstCourse);
    } catch (err) { }
  };

  const handleCourseChange = (e) => {
    const cId = e.target.value;
    setForm(prev => ({ ...prev, courseId: cId }));
    fetchMatrix(form.groupId, cId);
  };

  const renderStatus = (status) => {
    if (!status) return <span className="text-gray-300 font-medium">-</span>;
    const styles = {
      present: "bg-green-100 text-green-700 font-bold",
      absent: "bg-red-100 text-red-700 font-bold",
      late: "bg-yellow-100 text-yellow-700 font-bold"
    };
    return (
      <span className={`${styles[status.toLowerCase()] || "bg-gray-100"} px-2 py-0.5 rounded text-[10px] uppercase tracking-wide`}>
        {status[0]}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Table className="w-6 h-6 text-indigo-500"/> Course Matrix
          </h3>
          <p className="text-gray-500 text-sm mt-1">Select a course to manage attendance recordings.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select value={form.groupId} onChange={handleGroupChange} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="" disabled>Select Group</option>
            {myGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          
          <select 
            value={form.courseId} 
            onChange={handleCourseChange} 
            disabled={!form.groupId} 
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="" disabled>Select Course</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>
                {/* Properly formatted Teacher (Course) label */}
                {c.teacher?.name ? `${c.teacher.name} (${c.name})` : c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
      <div className="flex flex-col justify-center items-center py-24 min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm">
    <UniLifeLoader size="1" />
    <div className="mt-8 flex flex-col items-center">
      <p className="text-xs font-bold text-indigo-400 tracking-[0.3em] uppercase animate-pulse">
        Generating Matrix
      </p>
      {/* Subtle progress indicator */}
      <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-3 opacity-40"></div>
    </div>
  </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-xs font-bold text-gray-500 uppercase min-w-[120px]">Student ID</th>
                  <th className="sticky top-0 left-[120px] z-30 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-xs font-bold text-gray-500 uppercase min-w-[180px]">Name</th>
                  {matrixData.sessionList.map(session => (
                    <th key={session.id} className="sticky top-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center whitespace-nowrap min-w-[80px]">
                      {session.display}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matrixData.students.map((st) => (
                  <tr key={st.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-indigo-50/30 border-r border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">{st.studentId}</td>
                    <td className="sticky left-[120px] z-10 bg-white group-hover:bg-indigo-50/30 border-r border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 truncate">{st.name}</td>
                    {matrixData.sessionList.map(session => (
                      <td 
                        key={session.id} 
                        onClick={() => handleMarkAttendance(st.id, session)}
                        className={`border-r border-gray-200 px-4 py-3 text-center transition-all ${canMark ? 'cursor-pointer hover:bg-indigo-100' : ''}`}
                      >
                        {renderStatus(st.records[session.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMatrixTab;