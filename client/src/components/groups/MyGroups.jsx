import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { useNavigate, Link } from 'react-router-dom'; 
import GroupMembers from './GroupMembers';
import GroupAttendance from './GroupAttendance';
import GroupRoutine from './GroupRoutine';
import StudentAttendanceView from './StudentAttendanceView';
import NoticeBoard from '../noticeboard/NoticeBoard'; // NEW: Imported NoticeBoard directly
import api from '../../utils/Api';
import './MyGroups.css';
import UniLifeLoader from '../Loader/UniLifeLoader';

import { MessageCircle, BookOpen, Calendar as CalendarIcon } from 'lucide-react';

const MyGroups = () => { // FIXED: Removed the dependency on the external onViewNotices prop
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [showStudentAttendance, setShowStudentAttendance] = useState(false);
  const [showNotices, setShowNotices] = useState(false); // NEW: Internal state for Notice Board
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate(); 

  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/groups/my-groups');
      if (response.data.success) {
        setMyGroups(response.data.groups);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMembers = (group) => { setSelectedGroup(group); setShowMembers(true); };
  const handleViewAttendance = (group) => { setSelectedGroup(group); setShowAttendance(true); };
  const handleViewRoutine = (group) => { setSelectedGroup(group); setShowRoutine(true); };
  const handleViewStudentAttendance = (group) => { setSelectedGroup(group); setShowStudentAttendance(true); };
  
  // NEW: Internal handler for Notice Board
  const handleViewNotices = (group) => { 
    setSelectedGroup(group); 
    setShowNotices(true); 
  };

  const handleViewChat = (group) => {
    if (!group || !group._id) return;
    navigate(`/chat/${group._id}`, { state: { groupName: group.name, memberCount: group.members?.length || 0 } });
    window.scrollTo(0, 0);
  };

  const handleViewSyllabus = (group) => {
    if (!group || !group._id) return;
    navigate(`/syllabus/${group._id}`, { state: { groupName: group.name } });
    window.scrollTo(0, 0);
  };

  const handleViewCalendar = (group) => {
    if (!group || !group._id) return;
    navigate(`/calendar/${group._id}`, { state: { groupName: group.name } });
    window.scrollTo(0, 0);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'cr': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Teacher';
      case 'cr': return 'CR';
      default: return 'Student';
    }
  };

  const getMemberCount = (group) => {
    return group.members?.length || 0;
  };

  return (
    <>
      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">My Groups</h2>
          <button
            onClick={fetchMyGroups}
            className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-all"
            title="Refresh"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchMyGroups}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <UniLifeLoader size="1" />
          </div>
        ) : myGroups.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Groups Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              You haven't joined any groups yet. Create a new group or request to join an existing one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myGroups.map((item, index) => {
              const group = item.group;
              const memberCount = getMemberCount(group);

              return (
                <div
                  key={index}
                  className="group-card-item p-6 flex flex-col items-start justify-between gap-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                      {group.createdBy === user?._id && (
                        <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-800 rounded-full font-semibold border border-indigo-200/50">
                          Creator
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{group.description}</p>
                    )}

                    <div className="flex items-center mt-4 space-x-4">
                      <div className="flex items-center space-x-1">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-600">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>

                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleBadgeColor(item.role)} shadow-sm`}>
                        {getRoleDisplayName(item.role)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      
                      <button
                        onClick={() => handleViewMembers(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Members</span>
                      </button>

                      <button
                        onClick={() => handleViewAttendance(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>Attendance</span>
                      </button>

                      <button
                        onClick={() => handleViewRoutine(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-purple-600 border border-purple-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Routine</span>
                      </button>

                      {/* FIXED: Uses the internal handler */}
                      <button
                        onClick={() => handleViewNotices(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-emerald-600 border border-emerald-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-emerald-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <span>Notice Board</span>
                      </button>

                      <button
                        onClick={() => handleViewChat(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={() => handleViewSyllabus(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-orange-600 border border-orange-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-orange-50"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>Syllabus</span>
                      </button>

                      <button
                        onClick={() => handleViewCalendar(group)}
                        className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-rose-600 border border-rose-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-rose-50"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>Calendar</span>
                      </button>

                      {isStudent && (
                        <button
                          onClick={() => handleViewStudentAttendance(group)}
                          className="btn-outline-premium w-full px-3 py-2 text-sm font-semibold text-green-600 border border-green-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>My Att.</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showMembers && selectedGroup && (
        <GroupMembers
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowMembers(false);
            setSelectedGroup(null);
            fetchMyGroups();
          }}
        />
      )}

      {showAttendance && selectedGroup && (
        <GroupAttendance
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowAttendance(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {showRoutine && selectedGroup && (
        <GroupRoutine
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowRoutine(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {showStudentAttendance && selectedGroup && (
        <StudentAttendanceView
          groupId={selectedGroup._id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowStudentAttendance(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {/* NEW: Notice Board rendered as an internal modal */}
      {showNotices && selectedGroup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in-down border border-white">
            
            <button
              onClick={() => {
                setShowNotices(false);
                setSelectedGroup(null);
              }}
              className="absolute top-6 right-6 z-50 p-2.5 bg-white rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-md border border-slate-100"
              title="Close Notice Board"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <NoticeBoard groupId={selectedGroup._id} groupName={selectedGroup.name} />
            
          </div>
        </div>
      )}
    </>
  );
};

export default MyGroups;