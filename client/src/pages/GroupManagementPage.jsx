import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/Api";
import { useAuth } from "../../context/Authcontext";
import socket from "../../utils/socket";
import UniLifeLoader from "../Loader/UniLifeLoader";

const GroupAttendance = ({ groupId, groupName, onClose }) => {
  const { user } = useAuth();

  // NEW: States for Group Dropdown
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(groupId);
  const [activeGroupName, setActiveGroupName] = useState(groupName);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");

  const [attendanceData, setAttendanceData] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [extraClasses, setExtraClasses] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const scrollContainerRef = useRef(null);
  const todayRef = useRef(null);

  // CR role is removed from canMark. Now only Teacher and Admin can mark attendance.
  const canMark = user && ["teacher", "admin"].includes(user.role);

  // Utility to get safe local YYYY-MM-DD
  const getLocalYYYYMMDD = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  // Utility for DD/MM/YY format
  const getLocalDDMMYY = (dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  // 1. Fetch all groups user belongs to (For the new Group Dropdown)
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups/my-groups");
        const validGroups =
          res.data.groups?.map((g) => g.group).filter(Boolean) || [];
        setGroups(validGroups);
      } catch (err) {
        console.error("Failed to load groups", err);
      }
    };
    fetchGroups();
  }, []);

  // 2. Fetch courses whenever activeGroupId changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!activeGroupId) return;
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/attendance/courses/${activeGroupId}`);
        let availableCourses = res.data.courses || [];

        // Filter: Teachers only see courses they are assigned to in this group
        if (user.role === "teacher") {
          availableCourses = availableCourses.filter(
            (c) => (c.teacher?._id || c.teacher) === user._id,
          );
        }

        setCourses(availableCourses);
        if (availableCourses.length > 0) {
          setSelectedCourse(availableCourses[0]._id);
        } else {
          setSelectedCourse("");
          setAttendanceData([]);
          setActiveSessions([]);
          setLoading(false);
          if (user.role === "teacher")
            setError("No courses assigned to you in this group.");
        }
      } catch (err) {
        setError("Failed to load courses");
        setLoading(false);
      }
    };
    fetchCourses();
  }, [activeGroupId, user._id, user.role]);

  // 3. Fetch Attendance Matrix based on Selected Course
  const fetchAttendance = async () => {
    if (!selectedCourse) return;
    try {
      setLoading(true);
      const res = await api.get(
        `/attendance/group/${activeGroupId}?courseId=${selectedCourse}`,
      );
      setAttendanceData(res.data.data || []);
      setActiveSessions(res.data.activeSessions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  // 4. Effect for Matrix Loading and Real-time Socket Sync
  useEffect(() => {
    if (!selectedCourse || !activeGroupId) return;

    fetchAttendance();
    socket.emit("join_classroom", activeGroupId);

    const handleUpdate = (data) => {
      if (data.groupId === activeGroupId && data.courseId === selectedCourse) {
        fetchAttendance();
      }
    };

    socket.on("attendance-updated", handleUpdate);

    return () => {
      socket.off("attendance-updated", handleUpdate);
      socket.emit("leave_classroom", activeGroupId);
    };
  }, [activeGroupId, selectedCourse]);

  // 5. Center "Today's" column precisely in the middle of the screen
  useEffect(() => {
    if (!loading && todayRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const element = todayRef.current;
        // Calculates exact center of the visible container
        const scrollLeft =
          element.offsetLeft -
          container.clientWidth / 2 +
          element.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }, 300); // 300ms ensures DOM has fully painted before scrolling
    }
  }, [loading, activeSessions, selectedCourse]);

  const handleMark = async (studentId, session, currentStatus) => {
    if (!selectedCourse) return;

    // Cycle logic: present -> absent -> none(cleared) -> present
    let newStatus = "present";
    if (currentStatus === "present" || currentStatus === "attended")
      newStatus = "absent";
    else if (currentStatus === "absent" || currentStatus === "missed")
      newStatus = "";

    try {
      // Optimistic UI update
      setAttendanceData((prev) =>
        prev.map((item) =>
          item.studentId === studentId
            ? {
                ...item,
                attendance: { ...item.attendance, [session.key]: newStatus },
              }
            : item,
        ),
      );

      await api.post("/attendance/mark", {
        groupId: activeGroupId,
        studentId,
        courseId: selectedCourse,
        date: session.dateStr,
        sessionIndex: session.sessionIndex,
        status: newStatus,
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark");
      fetchAttendance(); // Revert on failure
    }
  };

  // ------------------------------------------------------------------
  // Compile Dynamic Sub-cells for Today
  // ------------------------------------------------------------------
  const todayStr = getLocalYYYYMMDD();
  let combinedSessions = [...activeSessions];
  const existingTodayCount = combinedSessions.filter(
    (s) => s.dateStr === todayStr,
  ).length;

  if (canMark) {
    // Calculate how many columns we need for today: 1 base class + requested extra classes
    const requiredToday = Math.max(
      1 + extraClasses,
      existingTodayCount === 0 ? 1 : existingTodayCount,
    );

    for (let i = 1; i <= requiredToday; i++) {
      const sessionKey = `${todayStr}_S${i}`;
      // Inject an empty editable column dynamically if not in DB yet
      if (!combinedSessions.find((s) => s.key === sessionKey)) {
        combinedSessions.push({
          key: sessionKey,
          dateStr: todayStr,
          sessionIndex: i,
          display: `${getLocalDDMMYY(todayStr)} (C${i})`,
          isToday: true,
        });
      }
    }
  } else {
    // For students: just mark existing today sessions so they get highlighted
    combinedSessions.forEach((s) => {
      if (s.dateStr === todayStr) s.isToday = true;
    });
  }

  // Sort them chronologically by date and session index
  combinedSessions.sort((a, b) => a.key.localeCompare(b.key));

  if (loading && attendanceData.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-7xl w-full h-[90vh] flex flex-col justify-center items-center shadow-2xl">
          <UniLifeLoader size="1.2" />
          <p className="mt-4 text-gray-500 font-medium animate-pulse">
            Syncing UniLife Attendance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-7xl w-full h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Attendance - {activeGroupName}</h2>
          <div className="flex gap-2 text-sm items-center mr-6">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Present
            <span className="w-3 h-3 rounded-full bg-red-500 ml-2"></span>{" "}
            Absent
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          {/* NEW: GROUP SELECTION DROPDOWN */}
          <select
            value={activeGroupId}
            onChange={(e) => {
              setActiveGroupId(e.target.value);
              const grp = groups.find((g) => g._id === e.target.value);
              if (grp) setActiveGroupName(grp.name);
              setSelectedCourse(""); // Reset course when group changes
              setExtraClasses(0); // Reset extra classes
            }}
            className="border rounded-md px-3 py-2 bg-indigo-50 border-indigo-200 font-bold text-indigo-800 focus:outline-indigo-500 min-w-[200px] cursor-pointer"
          >
            {groups.length === 0 && (
              <option value={activeGroupId}>{activeGroupName}</option>
            )}
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>

          {/* Course Selection */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border rounded-md px-3 py-2 bg-blue-50 border-blue-200 font-bold text-blue-800 focus:outline-blue-500 min-w-[250px] cursor-pointer"
          >
            {courses.length === 0 && <option value="">No Courses Found</option>}
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name} ({course.teacher?.name || "Unknown"})
              </option>
            ))}
          </select>

          {/* THE EXTRA CLASS DROPDOWN */}
          {canMark && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-bold text-gray-700">
                Extra Classes Today:
              </span>
              <select
                value={extraClasses}
                onChange={(e) => setExtraClasses(parseInt(e.target.value))}
                className="border rounded-md px-3 py-2 bg-gray-50 border-gray-300 font-semibold focus:outline-blue-500 cursor-pointer"
              >
                <option value={0}>None</option>
                <option value={1}>+ 1 Extra Class</option>
                <option value={2}>+ 2 Extra Classes</option>
                <option value={3}>+ 3 Extra Classes</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Scrollable Matrix */}
        <div
          className="flex-1 overflow-auto rounded-lg border border-gray-200 relative shadow-inner"
          ref={scrollContainerRef}
        >
          {attendanceData.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No records found for the selected course.
            </div>
          ) : (
            <table className="min-w-full border-collapse bg-white">
              <thead className="bg-gray-100 sticky top-0 z-20">
                <tr>
                  <th className="border p-3 min-w-[120px] sticky left-0 bg-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-30 font-bold">
                    Student ID
                  </th>
                  <th className="border p-3 min-w-[200px] text-left">Name</th>

                  {combinedSessions.map((session) => (
                    <th
                      key={session.key}
                      ref={
                        session.isToday && !todayRef.current ? todayRef : null
                      }
                      className={`border p-2 min-w-[90px] whitespace-nowrap text-center ${
                        session.isToday
                          ? "bg-blue-200 font-extrabold text-blue-800"
                          : "text-gray-600"
                      }`}
                    >
                      {session.display}
                      {session.isToday && (
                        <div className="text-[10px] text-blue-600 uppercase font-black">
                          Today
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="border p-3 font-mono font-semibold sticky left-0 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap text-gray-800">
                      {student.studentNumber || "N/A"}
                    </td>
                    <td className="border p-3 whitespace-nowrap font-medium text-gray-700">
                      {student.name}
                    </td>

                    {combinedSessions.map((session) => {
                      const status = student.attendance[session.key];
                      // STRICT LOGIC: Only "Today" is editable
                      const editable = canMark && session.isToday;

                      return (
                        <td
                          key={session.key}
                          className={`border p-2 text-center ${session.isToday ? "bg-blue-50/50" : ""}`}
                        >
                          {editable ? (
                            <button
                              onClick={() =>
                                handleMark(student.studentId, session, status)
                              }
                              className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${
                                status === "present" || status === "attended"
                                  ? "bg-green-500 hover:bg-green-600 shadow-md ring-2 ring-green-300"
                                  : status === "absent" || status === "missed"
                                    ? "bg-red-500 hover:bg-red-600 shadow-md ring-2 ring-red-300"
                                    : "bg-gray-200 hover:bg-gray-300 border border-gray-300"
                              }`}
                            />
                          ) : (
                            <div className="flex justify-center">
                              <span
                                className={`inline-block w-6 h-6 rounded-full ${
                                  status === "present" || status === "attended"
                                    ? "bg-green-500 shadow-sm"
                                    : status === "absent" || status === "missed"
                                      ? "bg-red-500 shadow-sm"
                                      : "bg-gray-100"
                                }`}
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 sticky bottom-0 z-20 font-semibold shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                <tr>
                  <td className="border p-3 sticky left-0 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-30"></td>
                  <td className="border p-3 text-right text-gray-600">
                    Daily Total (P/A)
                  </td>

                  {combinedSessions.map((session) => {
                    const presentCount = attendanceData.filter(
                      (s) =>
                        s.attendance[session.key] === "present" ||
                        s.attendance[session.key] === "attended",
                    ).length;
                    const absentCount = attendanceData.filter(
                      (s) =>
                        s.attendance[session.key] === "absent" ||
                        s.attendance[session.key] === "missed",
                    ).length;

                    return (
                      <td
                        key={session.key}
                        className={`border p-2 text-center text-sm ${session.isToday ? "bg-blue-100" : ""}`}
                      >
                        <span className="text-green-600">{presentCount}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600">{absentCount}</span>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {canMark && courses.length > 0 && (
          <p className="text-sm font-medium text-blue-600 mt-4 flex items-center bg-blue-50 p-2 rounded-lg border border-blue-100">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            Attendance is course-specific. Only "Today's" sessions are
            interactive. Past records are locked.
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupAttendance;
