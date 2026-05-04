import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

import { 
  CalendarDays, MessageSquare, Bell, FileText, BookOpen, 
  Calendar, ClipboardList, Users, Key, User, Shield, UserCheck 
} from "lucide-react";

const ClassroomPage = () => {
  const { id } = useParams(); // This is the groupId
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTeacher = ["teacher", "admin"].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // API call migrated from /classrooms to /groups
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.error("Failed to fetch group data");
    } finally {
      setLoading(false);
    }
  };

  const setClassRep = async (studentId) => {
    try {
      // API call migrated to group-specific CR setting endpoint
      await api.put(`/groups/${id}/set-cr`, { userId: studentId });
      fetchData();
    } catch (err) {
      alert("Failed to update Class Representative");
    }
  };

  // Helper to extract members by role from the Group schema
  const students = group?.members?.filter(m => m.role === 'student' || m.role === 'cr') || [];
  const teachers = group?.members?.filter(m => m.role === 'teacher') || [];
  const classRep = group?.members?.find(m => m.role === 'cr')?.user;

  const sections = [
    { icon: MessageSquare, label: "Discussion", desc: "Group chat & discussions", to: "notfound", color: "text-blue-600 bg-blue-50" },
    { icon: Bell, label: "Notices", desc: "Announcements & notices", to: `/notices/${id}`, color: "text-yellow-600 bg-yellow-50" },
    { icon: FileText, label: "Materials", desc: "Study materials & files", to: `/materials/${id}`, color: "text-green-600 bg-green-50" },
    { icon: BookOpen, label: "Syllabus", desc: "Course syllabus & progress", to: `/syllabus/${id}`, color: "text-purple-600 bg-purple-50" },
    { icon: Calendar, label: "Schedule", desc: "Class timetable", to: `/schedule`, color: "text-indigo-600 bg-indigo-50" },
    { icon: CalendarDays, label: "Academic Cal.", desc: "Semester calendar", to: "notfound", color: "text-pink-600 bg-pink-50" },
    { icon: ClipboardList, label: "Attendance", desc: "Track attendance records", to: `/attendance/${id}`, color: "text-orange-600 bg-orange-50" },
  ];

  if (loading) return <div className="flex justify-center py-20"><UniLifeLoader size="md" /></div>;
  if (!group) return <div className="card text-center py-16 text-gray-500">Group not found.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-500 mt-0.5">{group.department} · Year {group.year} · Sem {group.semester}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 text-sm bg-gray-100 rounded-lg px-3 py-1.5">
              <Key className="w-4 h-4 text-gray-500" />
              <span className="font-mono font-bold text-gray-700">{group.inviteCode}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4" /> {students.length} Students</div>
          <div className="flex items-center gap-2 text-sm text-gray-600"><User className="w-4 h-4" /> {teachers.length} Teachers</div>
          {classRep && <div className="flex items-center gap-2 text-sm text-purple-700"><Shield className="w-4 h-4" /> CR: {classRep.name}</div>}
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {sections.map(({ icon: Icon, label, desc, to, color }) => (
          <Link key={label} to={to} className={`card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-all ${color}`}>
            <Icon className="w-6 h-6" />
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs opacity-70 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Members */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-primary-600" /> Students ({students.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {students.map((m) => (
              <div key={m.user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">{m.user.name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-400">{m.user.studentId || m.user.email}</p>
                  </div>
                </div>
                {m.role === 'cr' ? <span className="badge bg-purple-100 text-purple-700">CR</span> : 
                  isTeacher && <button onClick={() => setClassRep(m.user._id)} className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Set CR</button>
                }
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><User className="w-5 h-5 text-green-600" /> Teachers</h3>
          <div className="space-y-2">
            {teachers.map((m) => (
              <div key={m.user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">{m.user.name?.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                  <p className="text-xs text-gray-400">{m.user.department || m.user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomPage;