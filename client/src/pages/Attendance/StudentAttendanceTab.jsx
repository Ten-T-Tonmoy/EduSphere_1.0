import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import { BookOpen, CheckCircle, XCircle, AlertCircle, TrendingUp, User, Filter } from 'lucide-react';
import UniLifeLoader from '../../components/Loader/UniLifeLoader';


const StudentAttendanceTab = () => {
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchSyllabusInfo();
      await fetchMyAttendance();
      setLoading(false);
    };
    initialize();
  }, []);

  const fetchSyllabusInfo = async () => {
    try {
      const groupsRes = await api.get('/groups/my-groups');
      const groups = groupsRes.data.groups || [];
      let allCourses = [];
      for (const item of groups) {
        if (item.group?._id) {
          // Fetch syllabus for each group to map Teacher -> Course
          const courseRes = await api.get(`/syllabus/group/${item.group._id}`);
          allCourses = [...allCourses, ...(courseRes.data || [])];
        }
      }
      setAvailableCourses(allCourses);
    } catch (err) {
      console.error("Failed to fetch syllabus metadata", err);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const res = await api.get('/attendance');
      const records = Array.isArray(res.data) ? res.data : (res.data.attendance || []);
      const statsMap = {};

      records.forEach(record => {
        const courseId = record.course?._id || record.course || "unknown";
        const courseName = record.course?.name || "Enrolled Course";

        if (!statsMap[courseId]) {
          // FIXED: Now correctly includes 'id' so filtering logic works
          statsMap[courseId] = { 
            id: courseId, 
            name: courseName, 
            present: 0, 
            absent: 0, 
            late: 0, 
            total: 0 
          };
        }

        statsMap[courseId].total += 1;
        let status = record.status;
        if (record.records && Array.isArray(record.records)) {
          const myRecord = record.records[0];
          if (myRecord) status = myRecord.status;
        }

        if (status === 'present') statsMap[courseId].present += 1;
        else if (status === 'absent') statsMap[courseId].absent += 1;
        else if (status === 'late') statsMap[courseId].late += 1;
      });
      setAttendanceStats(Object.values(statsMap));
    } catch (error) {
      console.error("Error fetching personal records", error);
    }
  };

  const filteredStats = selectedFilter === 'all' 
    ? attendanceStats 
    : attendanceStats.filter(s => s.id === selectedFilter);

  if (loading) {
  return (
    <div className="flex flex-col justify-center items-center py-24 min-h-[400px]">
      {/* Using your UniLifeLoader component */}
      <UniLifeLoader size="1" />
      
      <div className="mt-8 flex flex-col items-center">
        <p className="text-xs font-bold text-indigo-400 tracking-[0.3em] uppercase animate-pulse">
          Calculating Statistics
        </p>
        <p className="text-[10px] text-gray-400 font-medium mt-1">
          Synchronizing with faculty records...
        </p>
      </div>
    </div>
  );
}
  return (
    <div className="space-y-6">
      {/* Interactive Teacher (Course) Selection Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-indigo-600 font-bold">
          <Filter className="w-5 h-5"/>
          <span className="text-sm">Quick Filter:</span>
        </div>
        <select 
          value={selectedFilter} 
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="all">All Teachers & Courses</option>
          {availableCourses.map(c => (
            <option key={c._id} value={c._id}>
              {c.teacher?.name ? `${c.teacher.name} (${c.name})` : c.name}
            </option>
          ))}
        </select>
      </div>

      {filteredStats.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-lg">No personal records matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredStats.map((stat, idx) => {
            const courseInfo = availableCourses.find(c => c._id === stat.id);
            const pct = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
            const ringColor = pct < 60 ? "text-red-500" : pct < 75 ? "text-yellow-500" : "text-green-500";

            return (
              <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                <h4 className="font-bold text-gray-900 text-lg mb-2 truncate" title={stat.name}>{stat.name}</h4>
                
                {/* Visual Teacher Tag on Card Header */}
                {courseInfo?.teacher && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-full mb-4 border border-indigo-100 shadow-sm">
                    <User className="w-3 h-3"/> {courseInfo.teacher.name}
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-6">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" stroke="#f1f5f9" strokeWidth="3" fill="none" />
                      <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${pct}, 100`} className={ringColor} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-sm font-bold text-gray-800">{pct}%</span>
                  </div>
                  
                  <div className="space-y-1 text-xs font-semibold w-1/2">
                    <div className="flex justify-between items-center text-green-600 bg-green-50 px-2 py-1.5 rounded-lg border border-green-100">
                      <span>Present</span> <span>{stat.present}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-500 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100">
                      <span>Absent</span> <span>{stat.absent}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                      <span>Total</span> <span>{stat.total}</span>
                    </div>
                  </div>
                </div>
                
                {pct < 75 && (
                   <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl mt-2 border border-red-100">
                     <AlertCircle className="w-4 h-4"/> Warning: Attendance Below 75%
                   </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAttendanceTab;