import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/Authcontext";
import { useNavigate, Link } from "react-router-dom";
import GroupMembers from "./GroupMembers";
import GroupAttendance from "./GroupAttendance";
import GroupRoutine from "./GroupRoutine";
import StudentAttendanceView from "./StudentAttendanceView";
import NoticeBoard from "../noticeboard/NoticeBoard"; // NEW: Imported NoticeBoard directly
import api from "../../utils/Api";
import "./MyGroups.css";
import UniLifeLoader from "../Loader/UniLifeLoader";

import {
  MessageCircle,
  BookOpen,
  Calendar as CalendarIcon,
} from "lucide-react";

const MyGroups = () => {
  // FIXED: Removed the dependency on the external onViewNotices prop
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [showStudentAttendance, setShowStudentAttendance] = useState(false);
  const [showNotices, setShowNotices] = useState(false); // NEW: Internal state for Notice Board
  const [error, setError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const isStudent = user?.role === "student";

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/groups/my-groups");
      if (response.data.success) {
        setMyGroups(response.data.groups);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleViewMembers = (group) => {
    setSelectedGroup(group);
    setShowMembers(true);
  };
  const handleViewAttendance = (group) => {
    setSelectedGroup(group);
    setShowAttendance(true);
  };
  const handleViewRoutine = (group) => {
    setSelectedGroup(group);
    setShowRoutine(true);
  };
  const handleViewStudentAttendance = (group) => {
    setSelectedGroup(group);
    setShowStudentAttendance(true);
  };

  // NEW: Internal handler for Notice Board
  const handleViewNotices = (group) => {
    setSelectedGroup(group);
    setShowNotices(true);
  };

  const handleViewChat = (group) => {
    if (!group || !group._id) return;
    navigate(`/chat/${group._id}`, {
      state: { groupName: group.name, memberCount: group.members?.length || 0 },
    });
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
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "cr":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "teacher":
        return "Teacher";
      case "cr":
        return "CR";
      default:
        return "Student";
    }
  };

  const getMemberCount = (group) => {
    return group.members?.length || 0;
  };

  return (
    <>
      {/* ── Main card ── */}
      <div className=" p-1 md:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            My Groups
          </h2>
          <button
            onClick={fetchMyGroups}
            title="Refresh"
            className="p-2 rounded-full text-indigo-500 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchMyGroups}
              className="flex-shrink-0 rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="flex justify-center py-12">
            <UniLifeLoader size="1" />
          </div>
        ) : myGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
              <svg
                className="h-8 w-8 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-800">
              No groups yet
            </h3>
            <p className="mt-1 text-sm text-gray-400 max-w-xs">
              You haven't joined any groups. Create one or request to join an
              existing group.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {myGroups.map((item, index) => {
              const group = item.group;
              const memberCount = getMemberCount(group);

              const actionButtons = [
                {
                  label: "Members",
                  onClick: () => handleViewMembers(group),
                  color:
                    "text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100",
                  icon: (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Attendance",
                  onClick: () => handleViewAttendance(group),
                  color:
                    "text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100",
                  icon: (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Routine",
                  onClick: () => handleViewRoutine(group),
                  color:
                    "text-violet-600 border-violet-100 bg-violet-50 hover:bg-violet-100",
                  icon: (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Notice Board",
                  onClick: () => handleViewNotices(group),
                  color:
                    "text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100",
                  icon: (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Chat",
                  onClick: () => handleViewChat(group),
                  color:
                    "text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-100",
                  icon: <MessageCircle className="h-3.5 w-3.5" />,
                },
                {
                  label: "Syllabus",
                  onClick: () => handleViewSyllabus(group),
                  color:
                    "text-orange-600 border-orange-100 bg-orange-50 hover:bg-orange-100",
                  icon: <BookOpen className="h-3.5 w-3.5" />,
                },
                {
                  label: "Calendar",
                  onClick: () => handleViewCalendar(group),
                  color:
                    "text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-100",
                  icon: <CalendarIcon className="h-3.5 w-3.5" />,
                },
                ...(isStudent
                  ? [
                      {
                        label: "My Att.",
                        onClick: () => handleViewStudentAttendance(group),
                        color:
                          "text-green-600 border-green-100 bg-green-50 hover:bg-green-100",
                        icon: (
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        ),
                      },
                    ]
                  : []),
              ];

              return (
                <div
                  key={index}
                  className="relative flex flex-col gap-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md overflow-hidden"
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400" />

                  {/* Group info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">
                        {group.name}
                      </h3>
                      {group.createdBy === user?._id && (
                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                          Creator
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                        {group.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        <span className="text-xs text-gray-500 font-medium">
                          {memberCount}{" "}
                          {memberCount === 1 ? "member" : "members"}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRoleBadgeColor(item.role)}`}
                      >
                        {getRoleDisplayName(item.role)}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {actionButtons.map((btn) => (
                      <button
                        key={btn.label}
                        onClick={btn.onClick}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${btn.color}`}
                      >
                        {btn.icon}
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}

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

      {showNotices && selectedGroup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowNotices(false);
                setSelectedGroup(null);
              }}
              title="Close"
              className="absolute top-5 right-5 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <NoticeBoard
              groupId={selectedGroup._id}
              groupName={selectedGroup.name}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MyGroups;
