import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import socket from "../utils/socket";
import { motion, AnimatePresence } from "framer-motion";
import UniLifeLoader from "../components/Loader/UniLifeLoader";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  BookOpen,
  BarChart2,
  Users,
  ChevronDown,
  Filter,
  Calendar,
  Clock,
  Sparkles,
  User as UserIcon,
  LayoutGrid,
  FileOutput,
  FileSpreadsheet,
} from "lucide-react";

const statusStyles = {
  attended: "bg-emerald-100 text-emerald-700 border-emerald-200",
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  missed: "bg-rose-100 text-rose-700 border-rose-200",
  absent: "bg-rose-100 text-rose-700 border-rose-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  exam: "bg-blue-100 text-blue-700 border-blue-200",
  holiday: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-amber-100 text-amber-700 border-amber-200",
};

const AttendancePage = () => {
  const { user } = useAuth();
  const { groupId: urlGroupId } = useParams();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [todaySlots, setTodaySlots] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("today");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [matrixData, setMatrixData] = useState({
    activeSessions: [],
    students: [],
  });
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // EXTRA CLASS DROPDOWN STATE
  const [extraClasses, setExtraClasses] = useState(0);

  const isTeacher = ["teacher", "admin"].includes(user?.role);

  // Utility to get safe local YYYY-MM-DD
  const getLocalYYYYMMDD = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  // Utility for DD/MM/YY format
  const getLocalDDMMYY = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const r = await api.get("/groups/my-groups");
        const myGroups =
          r.data.groups?.map((item) => item.group).filter(Boolean) || [];
        setGroups(myGroups);
        if (urlGroupId) {
          setSelectedGroup(urlGroupId);
        } else if (myGroups.length > 0) {
          setSelectedGroup(myGroups[0]._id);
        }
      } catch (err) {
        console.error("Group sync failed", err);
      }
    };
    fetchInitialData();
    fetchToday();
  }, [urlGroupId]);

  useEffect(() => {
    if (selectedGroup) {
      const fetchCourses = async () => {
        try {
          const res = await api.get(`/syllabus/group/${selectedGroup}`);
          let allCourses = res.data;

          if (isTeacher) {
            allCourses = allCourses.filter(
              (c) => String(c.teacher?._id || c.teacher) === String(user._id),
            );
          }
          setCourses(allCourses);
        } catch (err) {
          console.error("Course fetch failed", err);
        }
      };
      fetchCourses();
    }
  }, [selectedGroup, isTeacher, user._id]);

  useEffect(() => {
    if (selectedGroup && selectedCourse && tab === "matrix") {
      setLoadingMatrix(true);

      const fetchMatrix = () => {
        api
          .get(
            `/interactive-matrix/${selectedGroup}?courseId=${selectedCourse}`,
          )
          .then((res) => {
            setMatrixData({
              activeSessions: res.data.activeSessions || [],
              students: res.data.data || [],
            });
          })
          .catch((err) => {
            console.error("Matrix fetch failed", err);
            setMatrixData({ activeSessions: [], students: [] });
          })
          .finally(() => setLoadingMatrix(false));
      };

      fetchMatrix();

      // Real-time Sync setup for the Page
      socket.emit("join_classroom", selectedGroup);
      const handleUpdate = (data) => {
        if (
          data.groupId === selectedGroup &&
          data.courseId === selectedCourse
        ) {
          api
            .get(
              `/interactive-matrix/${selectedGroup}?courseId=${selectedCourse}`,
            )
            .then((res) => {
              setMatrixData({
                activeSessions: res.data.activeSessions || [],
                students: res.data.data || [],
              });
            });
        }
      };
      socket.on("attendance-updated", handleUpdate);

      return () => {
        socket.off("attendance-updated", handleUpdate);
        socket.emit("leave_classroom", selectedGroup);
      };
    } else {
      setMatrixData({ activeSessions: [], students: [] });
    }
  }, [selectedGroup, selectedCourse, tab]);

  const handleExportToDocs = async () => {
    if (!selectedCourse || matrixData.activeSessions.length === 0) {
      return alert("Please select a course with active records first.");
    }
    try {
      setLoadingMatrix(true);
      const course = courses.find((c) => c._id === selectedCourse);
      const res = await api.get(
        `/interactive-matrix/export/${selectedGroup}?courseId=${selectedCourse}&courseName=${course.name}`,
      );

      if (res.data.success) {
        alert(
          "Preparing data for Google Docs... Please check your connected Google Drive.",
        );
        alert(
          `Export Data Prepared: "${res.data.documentTitle}"\n\nTo complete this, ensure your Google Cloud credentials are added to the server environment.`,
        );
      }
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export. Ensure you are logged into Google.");
    } finally {
      setLoadingMatrix(false);
    }
  };

  const fetchToday = async () => {
    try {
      const [slots, att] = await Promise.all([
        api.get("/schedules/student"),
        api.get("/attendance/today"),
      ]);
      const today = new Date().getDay();

      const slotsData = Array.isArray(slots.data)
        ? slots.data
        : slots.data?.data || [];
      setTodaySlots(
        slotsData.filter(
          (s) => s.dayOfWeek === today && s.status !== "cancelled",
        ),
      );

      const attendanceData = Array.isArray(att.data)
        ? att.data
        : att.data?.data || [];
      setTodayAttendance(attendanceData);
    } catch (err) {
      console.error("Failed to fetch today's data:", err);
    }
  };

  const getSlotAttendance = (slot) => {
    if (!Array.isArray(todayAttendance)) return undefined;
    const slotId = slot._id ? String(slot._id) : null;
    const courseId =
      slot.course?._id || slot.course
        ? String(slot.course?._id || slot.course)
        : null;
    return todayAttendance.find((a) => {
      const aSlotId =
        a.classSlot?._id || a.classSlot
          ? String(a.classSlot?._id || a.classSlot)
          : null;
      const aCourseId =
        a.course?._id || a.course ? String(a.course?._id || a.course) : null;
      return (
        (slotId && aSlotId === slotId) || (courseId && aCourseId === courseId)
      );
    });
  };

  const handleMarkAttendance = async (studentId, session, status) => {
    // FIX: Deeply update state to force React re-render
    setMatrixData((prev) => {
      const newStudents = prev.students.map((s) => {
        if (s.studentId === studentId) {
          return {
            ...s,
            attendance: { ...s.attendance, [session.key]: status },
          };
        }
        return s;
      });
      return { ...prev, students: newStudents };
    });

    try {
      await api.post("/attendance/mark", {
        groupId: selectedGroup,
        courseId: selectedCourse,
        studentId: studentId,
        date: session.dateStr,
        sessionIndex: session.sessionIndex,
        status: status,
      });
    } catch (err) {
      console.error("Failed to mark attendance", err);
    }
  };

  // Compile Dynamic Sub-cells for Extra Classes Today
  const todayStr = getLocalYYYYMMDD();
  let combinedSessions = matrixData.activeSessions
    ? [...matrixData.activeSessions]
    : [];
  const existingTodaySessions = combinedSessions.filter(
    (s) => s.dateStr === todayStr,
  );
  const existingCount = existingTodaySessions.length;

  if (isTeacher) {
    const requiredToday = Math.max(
      1 + extraClasses,
      existingCount === 0 ? 1 : existingCount,
    );

    for (let i = 1; i <= requiredToday; i++) {
      const sessionKey = `${todayStr}_S${i}`;
      // Inject an empty editable column dynamically using DD/MM/YY
      if (!combinedSessions.find((s) => s.key === sessionKey)) {
        combinedSessions.push({
          key: sessionKey,
          dateStr: todayStr,
          sessionIndex: i,
          display: `${getLocalDDMMYY()} (C${i})`,
          isToday: true,
        });
      }
    }
  }
  // Sort them chronologically
  combinedSessions.sort((a, b) => a.key.localeCompare(b.key));

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-8 font-sans text-slate-900 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[120px] -z-10" />

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8"
      >
        {/*-------------------------- Header Section----------------- */}
        <motion.div
          variants={itemVars}
          className="bg-slate-900 rounded-xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden mb-10 text-white"
        >
          <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-300 border border-white/10 mb-4">
              <Sparkles size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Attendance Ecosystem
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
              {isTeacher ? "Mark Attendance" : "Session Records"}
            </h1>
            <p className="text-slate-400 mt-4 max-w-xl text-sm font-medium italic">
              Synchronizing academic presence across all active network nodes.
            </p>
          </div>
          <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center min-w-[140px]">
            <p className="text-3xl font-black">{groups.length}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
              Active Batches
            </p>
          </div>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          variants={itemVars}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white shadow-xl shadow-slate-200/50">
            <label className="text-[10px] font-black uppercase text-indigo-600 mb-3 block flex items-center gap-2">
              <LayoutGrid size={14} /> Selected Group Context
            </label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border border-slate-100 py-3.5 px-5 rounded-2xl font-bold text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedCourse("");
                }}
              >
                <option value="">Switch Group...</option>
                {groups.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white shadow-xl shadow-slate-200/50">
            <label className="text-[10px] font-black uppercase text-indigo-600 mb-3 block flex items-center gap-2">
              <BookOpen size={14} /> Course Component & Assigned Teacher
            </label>
            <div className="relative">
              <select
                className="w-full bg-slate-50 border  border-slate-100 py-3.5 
                px-5 rounded-lg font-bold text-slate-800 appearance-none
                 outline-none focus:ring-2 focus:ring-indigo-600 transition-all
                  cursor-pointer"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Select Course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}{" "}
                    {c.teacher?.name
                      ? `(${c.teacher.name})`
                      : c.teacherName
                        ? `(${c.teacherName})`
                        : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          variants={itemVars}
          className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto pb-1"
        >
          {["today", "matrix"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === "matrix") setSelectedCourse("");
              }}
              className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${
                tab === t
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "matrix" ? "Interactive Matrix" : t}
            </button>
          ))}
        </motion.div>

        {/* -----------------------------today /matrix tab----------------------- */}
        <AnimatePresence mode="wait">
          {tab === "today" && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 max-w-4xl"
            >
              {todaySlots.filter(
                (s) => (s.group?._id || s.group) === selectedGroup,
              ).length === 0 ? (
                <div className="bg-white rounded-md p-12 text-center border border-dashed border-slate-200">
                  <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                    No sessions for this group today
                  </p>
                </div>
              ) : (
                todaySlots
                  .filter((s) => (s.group?._id || s.group) === selectedGroup)
                  .map((slot) => {
                    const att = getSlotAttendance(slot);
                    return (
                      <div
                        key={slot._id}
                        className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
                            <Clock size={24} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-lg">
                              {slot.course?.name || "Session"}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {slot.startTime} - {slot.endTime} • Rm{" "}
                              {slot.room || "TBA"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {att ? (
                            <span
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${statusStyles[att.status.toLowerCase()] || statusStyles.attended}`}
                            >
                              {att.status}
                            </span>
                          ) : (
                            <span className="px-4 py-2 rounded-md bg-slate-50 text-slate-400 text-[10px] font-black uppercase border border-slate-200">
                              Pending Call
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </motion.div>
          )}

          {tab === "matrix" && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              {/* Dynamic Interactive Teacher Controls */}
              {isTeacher &&
                selectedCourse &&
                matrixData.students.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-6 flex-wrap gap-4"
                  >
                    {/* EXTRA CLASS DROPDOWN BUTTON */}
                    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-lg shadow-sm border border-slate-200">
                      <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                        Extra Classes Today:
                      </label>
                      <select
                        value={extraClasses}
                        onChange={(e) =>
                          setExtraClasses(parseInt(e.target.value))
                        }
                        className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value={0}>None</option>
                        <option value={1}>+ 1 Extra Class</option>
                        <option value={2}>+ 2 Extra Classes</option>
                        <option value={3}>+ 3 Extra Classes</option>
                      </select>
                    </div>

                    <button
                      onClick={handleExportToDocs}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700
                       text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg
                       shadow-emerald-200 transition-all active:scale-95"
                    >
                      <FileOutput size={14} />
                      Export
                    </button>
                  </motion.div>
                )}

              {loadingMatrix ? (
                <div className="flex justify-center py-20">
                  <UniLifeLoader size="md" />
                </div>
              ) : !selectedCourse ? (
                <div className="bg-white rounded-lg p-20 text-center border border-dashed border-slate-200">
                  <BarChart2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                    Select a course to view interaction matrix
                  </p>
                </div>
              ) : matrixData.students.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 font-bold uppercase text-xs">
                  No attendance records or students found for this course.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden relative">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-20 shadow-md">
                            ID Node
                          </th>
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest">
                            Full Name
                          </th>
                          {combinedSessions.map((session) => (
                            <th
                              key={session.key}
                              className={`px-4 py-5 text-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-l border-white/10 ${session.dateStr === todayStr ? "bg-indigo-600 text-white" : ""}`}
                            >
                              {session.display}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixData.students.map((student, idx) => (
                          <tr
                            key={student.studentId}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                            }
                          >
                            <td className="px-6 py-4 border-b border-slate-100 text-xs font-black text-slate-900 sticky left-0 bg-inherit z-10">
                              {student.studentNumber || "N/A"}
                            </td>
                            <td className="px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-600 whitespace-nowrap">
                              {student.name}
                            </td>

                            {combinedSessions.map((session) => {
                              const status = student.attendance[session.key];
                              // Normalizes DB text format for <select>
                              const normalizedStatus =
                                (status === "attended"
                                  ? "present"
                                  : status === "missed"
                                    ? "absent"
                                    : status) || "";

                              // STRICT LOGIC: ONLY today's cells are editable. Past is read-only.
                              const isEditable =
                                isTeacher && session.dateStr === todayStr;

                              return (
                                <td
                                  key={session.key}
                                  className={`px-3 py-3 border-b border-l border-slate-100 text-center align-middle ${session.dateStr === todayStr ? "bg-indigo-50/20" : ""}`}
                                >
                                  {isEditable ? (
                                    <select
                                      className={`w-full min-w-[70px] text-center text-xs font-black p-2 rounded-xl appearance-none cursor-pointer border shadow-sm outline-none transition-all ${normalizedStatus === "present" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : normalizedStatus === "absent" ? "bg-rose-100 text-rose-700 border-rose-200" : normalizedStatus === "late" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"}`}
                                      value={normalizedStatus}
                                      onChange={(e) =>
                                        handleMarkAttendance(
                                          student.studentId,
                                          session,
                                          e.target.value,
                                        )
                                      }
                                    >
                                      <option value="">-</option>
                                      <option value="present">P</option>
                                      <option value="absent">A</option>
                                      <option value="late">L</option>
                                    </select>
                                  ) : normalizedStatus === "present" ? (
                                    <span className="text-emerald-500 font-black text-sm">
                                      P
                                    </span>
                                  ) : normalizedStatus === "absent" ? (
                                    <span className="text-rose-500 font-black text-sm">
                                      A
                                    </span>
                                  ) : normalizedStatus === "late" ? (
                                    <span className="text-amber-500 font-black text-sm">
                                      L
                                    </span>
                                  ) : (
                                    <span className="text-slate-200">-</span>
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AttendancePage;
