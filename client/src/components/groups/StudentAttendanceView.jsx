import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import { useAuth } from '../../context/Authcontext';
import io from 'socket.io-client';
import UniLifeLoader from '../Loader/UniLifeLoader';

const StudentAttendanceView = ({ groupId, groupName, onClose }) => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAttendance();
    fetchTeachers();

    // Socket for real-time updates
    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('attendance-updated', (data) => {
      if (data.groupId === groupId) {
        fetchAttendance(); // refresh data
      }
    });

    return () => socket.disconnect();
  }, [groupId, month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/student/${groupId}?month=${month}&year=${year}`);
      setAttendanceData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get(`/routine/group/${groupId}/teachers`);
      setTeachers(res.data.teachers);
    } catch (err) {
      console.error('Failed to fetch teachers');
    }
  };

  if (loading) return <div className="p-4 text-center"><UniLifeLoader size="1" /></div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">My Attendance - {groupName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="mb-4 flex space-x-4">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border rounded px-2 py-1 w-20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50">Date</th>
                {teachers.map(teacher => (
                  <th key={teacher.id} className="border p-2 bg-gray-50 text-sm">
                    {teacher.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((day, idx) => (
                <tr key={idx}>
                  <td className="border p-2 font-semibold">
                    {new Date(year, month - 1, day.day).toLocaleDateString()}
                  </td>
                  {teachers.map(teacher => {
                    const record = day.records.find(r => r.teacherId === teacher.id);
                    return (
                      <td key={teacher.id} className="border p-2 text-center">
                        {record ? (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceView;