// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom"; 
// import { useAuth } from "../../context/Authcontext"; // Path corrected for src/pages/ level
// import api from "../../utils/Api"; // Path corrected for src/pages/ level
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   ClipboardList, CheckCircle, XCircle, BookOpen, BarChart2,
//   Users, ChevronDown, Filter, Calendar, Clock,
//   Sparkles, User as UserIcon, LayoutGrid
// } from "lucide-react";

// const statusStyles = {
//   attended: "bg-emerald-100 text-emerald-700 border-emerald-200",
//   missed: "bg-rose-100 text-rose-700 border-rose-200",
//   exam: "bg-blue-100 text-blue-700 border-blue-200",
//   holiday: "bg-slate-100 text-slate-600 border-slate-200",
//   cancelled: "bg-amber-100 text-amber-700 border-amber-200",
// };

// const AttendancePage = () => {
//   const { user } = useAuth();
//   const { groupId: urlGroupId } = useParams(); 
//   const [groups, setGroups] = useState([]); 
//   const [selectedGroup, setSelectedGroup] = useState("");
//   const [records, setRecords] = useState([]);
//   const [summary, setSummary] = useState([]);
//   const [todaySlots, setTodaySlots] = useState([]);
//   const [todayAttendance, setTodayAttendance] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [tab, setTab] = useState("today");

//   const [courses, setCourses] = useState([]);
//   const [selectedCourse, setSelectedCourse] = useState("");
  
//   // Sequential numbering matrix data structure
//   const [matrixData, setMatrixData] = useState({ activeSessions: [], students: [] }); 
//   const [loadingMatrix, setLoadingMatrix] = useState(false);

//   const isTeacher = ["teacher", "admin"].includes(user?.role);

//   // --- LOGIC: Fetch Groups and Handle Navigation Context ---
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         const r = await api.get("/groups/my-groups"); 
//         const myGroups = r.data.groups?.map(item => item.group).filter(Boolean) || [];
//         setGroups(myGroups);

//         if (urlGroupId) {
//           setSelectedGroup(urlGroupId);
//         } else if (myGroups.length > 0) {
//           setSelectedGroup(myGroups[0]._id);
//         }
//       } catch (err) {
//         console.error("Group sync failed", err);
//       }
//     };
//     fetchInitialData();
//     fetchToday();
//   }, [urlGroupId]);

//   useEffect(() => {
//     if (selectedGroup && (tab === "history" || tab === "summary")) {
//       fetchRecords();
//       fetchSummary();
//     }
//   }, [selectedGroup, tab]);

//   // --- LOGIC: Fetch courses for dropdown based on Group syllabus ---
//   useEffect(() => {
//     if (selectedGroup) {
//       const fetchCourses = async () => {
//         try {
//           const res = await api.get(`/syllabus/group/${selectedGroup}`); 
//           let allCourses = res.data;
          
//           if (isTeacher) {
//             allCourses = allCourses.filter(c => 
//               String(c.teacher?._id || c.teacher) === String(user._id)
//             );
//           }
//           setCourses(allCourses);
//         } catch(err) {
//           console.error("Course fetch failed", err);
//         }
//       };
//       fetchCourses();
//     }
//   }, [selectedGroup, isTeacher, user._id]);

//   // --- LOGIC: Interactive Matrix Data Fetch (Sequential Numbering for Full Semester) ---
//   useEffect(() => {
//     if (selectedGroup && selectedCourse && tab === "matrix") {
//       setLoadingMatrix(true);
      
//       // Hits the dedicated semester-view endpoint
//       api.get(`/interactive-matrix/${selectedGroup}?courseId=${selectedCourse}`)
//          .then(res => {
//             // Backend now returns activeSessions and data
//             setMatrixData({ 
//               activeSessions: res.data.activeSessions || [], 
//               students: res.data.data || [] 
//             });
//          })
//          .catch(err => {
//             console.error("Matrix fetch failed", err);
//             setMatrixData({ activeSessions: [], students: [] });
//          })
//          .finally(() => setLoadingMatrix(false));
//     } else {
//       setMatrixData({ activeSessions: [], students: [] });
//     }
//   }, [selectedGroup, selectedCourse, tab]);

//   const fetchToday = async () => {
//     try {
//       const [slots, att] = await Promise.all([
//         api.get("/schedules/student"),
//         api.get("/attendance/today"),
//       ]);
//       const today = new Date().getDay();
//       setTodaySlots(slots.data.filter((s) => s.dayOfWeek === today && s.status !== "cancelled"));
//       setTodayAttendance(att.data);
//     } catch (err) {}
//   };

//   const fetchRecords = async () => {
//     setLoading(true);
//     try {
//       const endpoint = isTeacher ? `/group-attendance/group/${selectedGroup}` : `/group-attendance/student/${selectedGroup}`;
//       const res = await api.get(endpoint);
//       setRecords(res.data);
//     } catch (err) {} finally { setLoading(false); }
//   };

//   const fetchSummary = async () => {
//     try {
//       const res = await api.get(`/group-attendance/summary/${selectedGroup}`);
//       setSummary(res.data);
//     } catch (err) {}
//   };

//   const markAttendance = async (slot, status) => {
//     try {
//       await api.post("/group-attendance/mark", { 
//         groupId: selectedGroup,
//         studentId: user._id,
//         courseId: slot.course?._id || slot.course,
//         date: new Date().toISOString(),
//         status,
//       });
//       fetchToday();
//     } catch (err) { alert(err.response?.data?.message || "Failed"); }
//   };

//   const getSlotAttendance = (slotId) => todayAttendance.find((a) => a.classSlot === slotId || a.classSlot?._id === slotId);

//   const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
//   const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

//   return (
//     <div className="min-h-screen bg-slate-50 pb-20 pt-8 font-sans text-slate-900 relative overflow-x-hidden">
//       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -z-10" />
//       <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/40 rounded-full blur-[120px] -z-10" />

//       <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
//         {/* Header Section */}
//         <motion.div variants={itemVars} className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden mb-10 text-white">
//           <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 to-transparent pointer-events-none" />
//           <div className="relative z-10">
//             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-300 border border-white/10 mb-4">
//               <Sparkles size={12} className="animate-pulse" />
//               <span className="text-[10px] font-black uppercase tracking-widest">Attendance Ecosystem</span>
//             </div>
//             <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
//               {isTeacher ? "Mark Attendance" : "Session Records"}
//             </h1>
//             <p className="text-slate-400 mt-4 max-w-xl text-sm font-medium italic">Synchronizing academic presence across all active network nodes.</p>
//           </div>
//           <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center min-w-[140px]">
//             <p className="text-3xl font-black">{groups.length}</p>
//             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Batches</p>
//           </div>
//         </motion.div>

//         {/* Filter Controls */}
//         <motion.div variants={itemVars} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50">
//             <label className="text-[10px] font-black uppercase text-indigo-600 mb-3 block flex items-center gap-2">
//               <LayoutGrid size={14} /> Selected Group Context
//             </label>
//             <div className="relative">
//               <select
//                 className="w-full bg-slate-50 border border-slate-100 py-3.5 px-5 rounded-2xl font-bold text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
//                 value={selectedGroup}
//                 onChange={(e) => { setSelectedGroup(e.target.value); setSelectedCourse(""); }}
//               >
//                 <option value="">Switch Group...</option>
//                 {groups.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
//               </select>
//               <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//             </div>
//           </div>

//           <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/50">
//             <label className="text-[10px] font-black uppercase text-indigo-600 mb-3 block flex items-center gap-2">
//               <BookOpen size={14} /> Course Component & Assigned Teacher
//             </label>
//             <div className="relative">
//               <select
//                 className="w-full bg-slate-50 border border-slate-100 py-3.5 px-5 rounded-2xl font-bold text-slate-800 appearance-none outline-none focus:ring-2 focus:ring-indigo-600 transition-all cursor-pointer"
//                 value={selectedCourse}
//                 onChange={(e) => setSelectedCourse(e.target.value)}
//               >
//                 <option value="">Select Course...</option>
//                 {courses.map((c) => (
//                   <option key={c._id} value={c._id}>
//                     {c.name} {c.teacher?.name ? `(${c.teacher.name})` : c.teacherName ? `(${c.teacherName})` : ""}
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
//             </div>
//           </div>
//         </motion.div>

//         {/* Navigation Tabs */}
//         <motion.div variants={itemVars} className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto pb-1">
//           {["today", "history", "summary", "matrix"].map((t) => (
//             <button
//               key={t}
//               onClick={() => { setTab(t); if (t === 'matrix') setSelectedCourse(""); }}
//               className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${
//                 tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
//               }`}
//             >
//               {t === 'matrix' ? 'Interactive Matrix' : t}
//             </button>
//           ))}
//         </motion.div>

//         {/* Content Tabs */}
//         <AnimatePresence mode="wait">
//           {tab === "today" && (
//             <motion.div key="today" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-4xl">
//               {todaySlots.filter(s => (s.group?._id || s.group) === selectedGroup).length === 0 ? (
//                 <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
//                   <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
//                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No sessions for this group today</p>
//                 </div>
//               ) : (
//                 todaySlots.filter(s => (s.group?._id || s.group) === selectedGroup).map((slot) => {
//                   const att = getSlotAttendance(slot._id);
//                   return (
//                     <div key={slot._id} className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-lg transition-all">
//                       <div className="flex items-center gap-5">
//                         <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><Clock size={24} /></div>
//                         <div>
//                           <h3 className="font-black text-slate-900 text-lg">{slot.course?.name || "Session"}</h3>
//                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
//                             {slot.startTime} – {slot.endTime} • Rm {slot.room || "TBA"}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex gap-2">
//                         {att ? (
//                           <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${statusStyles[att.status]}`}>{att.status}</span>
//                         ) : (
//                           <>
//                             <button onClick={() => markAttendance(slot, "attended")} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Present</button>
//                             <button onClick={() => markAttendance(slot, "missed")} className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">Absent</button>
//                           </>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </motion.div>
//           )}

//           {tab === "history" && (
//             <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 max-w-4xl">
//               {loading ? (
//                 <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
//               ) : records.length === 0 ? (
//                 <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-200 text-slate-400 font-bold uppercase text-xs">No records found.</div>
//               ) : (
//                 records.map((r) => (
//                   <div key={r._id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 flex justify-between items-center hover:shadow-md transition-all">
//                     <div>
//                       {isTeacher && <p className="font-black text-slate-900">{r.student?.name}</p>}
//                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{r.course?.name || "General"}</p>
//                       <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(r.date).toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'short' })}</p>
//                     </div>
//                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[r.status]}`}>{r.status}</span>
//                   </div>
//                 ))
//               )}
//             </motion.div>
//           )}

//           {tab === "matrix" && (
//             <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
//               {loadingMatrix ? (
//                 <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>
//               ) : !selectedCourse ? (
//                 <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-slate-200">
//                   <BarChart2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
//                   <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Select a course to view interaction matrix</p>
//                 </div>
//               ) : matrixData.activeSessions.length === 0 ? (
//                 <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-200 text-slate-400 font-bold uppercase text-xs">No attendance records found for this course.</div>
//               ) : (
//                 <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden relative">
//                   <div className="overflow-x-auto">
//                     <table className="w-full border-collapse">
//                       <thead>
//                         <tr className="bg-slate-900 text-white">
//                           <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest sticky left-0 bg-slate-900 z-20 shadow-md">ID Node</th>
//                           <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest">Full Name</th>
//                           {/* Sequential headers: Class 1, 2, 3... */}
//                           {matrixData.activeSessions.map((_, idx) => (
//                             <th key={idx} className="px-4 py-5 text-center text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-l border-white/10">
//                               {idx + 1}
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {matrixData.students.map((student, idx) => (
//                           <tr key={student.studentId} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
//                             <td className="px-6 py-4 border-b border-slate-100 text-xs font-black text-slate-900 sticky left-0 bg-inherit z-10">{student.studentNumber || "N/A"}</td>
//                             <td className="px-6 py-4 border-b border-slate-100 text-xs font-bold text-slate-600 whitespace-nowrap">{student.name}</td>
//                             {/* Mapping cells back to specific normalized date strings */}
//                             {matrixData.activeSessions.map((dateKey) => {
//                               const status = student.attendance[dateKey];
//                               return (
//                                 <td key={dateKey} className="px-4 py-4 border-b border-l border-slate-100 text-center">
//                                   {status === "present" || status === "attended" ? <span className="text-emerald-500 font-black text-sm">P</span> : 
//                                    status === "absent" || status === "missed" ? <span className="text-rose-500 font-black text-sm">A</span> : 
//                                    status === "late" ? <span className="text-amber-500 font-black text-sm">L</span> : 
//                                    <span className="text-slate-200">-</span>}
//                                 </td>
//                               );
//                             })}
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </div>
//   );
// };

// export default AttendancePage;