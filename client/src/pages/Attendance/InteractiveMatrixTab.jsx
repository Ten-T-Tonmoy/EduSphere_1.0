import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import { Table, Calendar, Grid } from 'lucide-react';
import UniLifeLoader from '../../components/Loader/UniLifeLoader';

const InteractiveMatrixTab = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ groupId: '', courseId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [attendanceData, setAttendanceData] = useState([]);
  const [activeDays, setActiveDays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/my-groups');
      const groups = res.data.groups?.map(g => g.group).filter(Boolean) || [];
      setMyGroups(groups);
      if (groups.length > 0) handleGroupChange(groups[0]._id);
    } catch (err) { console.error("Group fetch error", err); }
  };

  const handleGroupChange = async (gId) => {
    setForm(prev => ({ ...prev, groupId: gId }));
    try {
      const courseRes = await api.get(`/syllabus/group/${gId}`);
      const courseList = courseRes.data || [];
      setCourses(courseList);
      if (courseList.length > 0) {
        const firstCId = courseList[0]._id;
        setForm(prev => ({ ...prev, courseId: firstCId }));
        fetchMatrix(gId, firstCId, form.month, form.year);
      }
    } catch (err) { }
  };

  const fetchMatrix = async (gId, cId, m, y) => {
    if (!gId || !cId) return;
    setLoading(true);
    try {
      const res = await api.get(`/group-attendance/group/${gId}?month=${m}&year=${y}&courseId=${cId}`);
      const data = res.data.data || [];
      setAttendanceData(data);
      
      // Calculate ACTIVE DAYS: filter days where at least one student has a status
      const daysMarked = new Set();
      data.forEach(student => {
        Object.entries(student.attendance).forEach(([day, status]) => {
          if (status) daysMarked.add(parseInt(day));
        });
      });
      setActiveDays(Array.from(daysMarked).sort((a, b) => a - b));
    } catch (err) { 
      setAttendanceData([]);
      setActiveDays([]);
    } finally { setLoading(false); }
  };

  const renderStatus = (status) => {
    if (!status) return "-";
    const styles = {
      present: "text-green-600 font-bold",
      absent: "text-red-600 font-bold",
      late: "text-yellow-600 font-bold"
    };
    return <span className={styles[status] || ""}>{status[0].toUpperCase()}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Grid className="w-6 h-6 text-indigo-500"/> Interactive Matrix (View Only)
          </h3>
          <p className="text-gray-500 text-sm mt-1">Attendance history for active class days.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select value={form.groupId} onChange={(e) => handleGroupChange(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500">
            {myGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          <select value={form.courseId} onChange={(e) => { setForm(p => ({...p, courseId: e.target.value})); fetchMatrix(form.groupId, e.target.value, form.month, form.year); }} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500">
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm">
    <UniLifeLoader size="1" />
    <div className="mt-8 flex flex-col items-center">
      <p className="text-xs font-bold text-indigo-400 tracking-[0.3em] uppercase animate-pulse">
        Analyzing Attendance Data
      </p>
      {/* Decorative accent */}
      <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full mt-3 opacity-40"></div>
    </div>
  </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 bg-gray-50 border-b border-r px-6 py-4 text-xs font-bold text-gray-500 uppercase z-10">Student ID</th>
                  {activeDays.map(day => (
                    <th key={day} className="border-b border-r px-4 py-4 text-xs font-bold text-gray-500 uppercase text-center min-w-[60px]">Day {day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceData.map((st) => (
                  <tr key={st.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="sticky left-0 bg-white border-r px-6 py-4 text-sm font-bold text-gray-700">{st.studentNumber}</td>
                    {activeDays.map(day => (
                      <td key={day} className="border-r px-4 py-4 text-center text-sm font-medium">
                        {renderStatus(st.attendance[day])}
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

export default InteractiveMatrixTab;