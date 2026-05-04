import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/Authcontext";
import api from "../../utils/Api";
import socket from "../../utils/socket"; 
import { Plus, Settings, ChevronDown } from "lucide-react";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";

import SlotCard from "./SlotCard";
import AddSlotModal from "./AddSlotModal";
import CancelModal from "./CancelModal";
import ExtraRequestModal from "./ExtraRequestModal";
import {
  DAYS, TIME_SLOTS, fmtTime, slotRowSpan, getCoveredCells,
  STATUS_STYLES, LAB_STYLES, addHours,
} from "./scheduleUtils";

const SchedulePage = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]); 
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showExtraModal, setShowExtraModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [extraReason, setExtraReason] = useState("");
  const [extraCourse, setExtraCourse] = useState("");
  const [extraClassroom, setExtraClassroom] = useState("");

  const [form, setForm] = useState({
    classroom: "", course: "", teacher: "", teachers: [],
    dayOfWeek: 0, startTime: "09:00", room: "", semester: 1, isLab: false, labDuration: 2,
  });

  const isTeacher = ["teacher", "admin"].includes(user?.role);
  const isManager = ["teacher", "admin", "class_rep"].includes(user?.role); 
  const todayIdx = new Date().getDay();

  const canEditSlot = (slot) => {
    if (!user) return false;
    if (['admin', 'class_rep'].includes(user.role)) return true;
    if (user.role === 'teacher') {
       const teacherId = slot.teacher?._id || slot.teacher;
       return String(teacherId) === String(user._id);
    }
    return false;
  };

  useEffect(() => {
    fetchAll();
    const handleScheduleUpdate = () => fetchAll();
    socket.on('schedule-updated', handleScheduleUpdate);
    return () => socket.off('schedule-updated', handleScheduleUpdate);
  }, [isEditMode]); 

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoint = isTeacher ? "/schedules/teacher" : "/schedules/student";
      const today = new Date().toISOString().split("T")[0];
      
      const [schedRes, groupRes, teachRes] = await Promise.all([
        api.get(`${endpoint}?date=${today}&editMode=${isEditMode}`),
        api.get("/groups/my-groups"), 
        api.get("/users/teachers"),
      ]);
      
      const formattedSlots = schedRes.data.map(slot => ({ ...slot, classroom: slot.group || slot.classroom }));
      setSlots(formattedSlots);

      const extractedGroups = groupRes.data.groups?.map(item => item.group).filter(Boolean) || [];
      setClassrooms(extractedGroups);
      setTeachers(teachRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesFor = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await api.get(`/syllabus/group/${groupId}`);
      setCourses(res.data);
    } catch {}
  };

  const slotGrid = {};
  DAYS.forEach((d) => {
    slotGrid[d] = {};
    TIME_SLOTS.forEach((t) => { slotGrid[d][t] = null; });
  });
  slots.forEach((slot) => {
    const day = DAYS[slot.dayOfWeek];
    if (day && TIME_SLOTS.includes(slot.startTime)) {
      slotGrid[day][slot.startTime] = slot;
    }
  });

  const coveredCells = getCoveredCells(slots);

  const handleAddSlot = async () => {
    const conflict = slots.find((s) => (s.classroom?._id === form.classroom || s.classroom === form.classroom) && s.dayOfWeek === form.dayOfWeek && s.startTime === form.startTime);
    if (conflict) { alert(`Slot conflict! ${DAYS[form.dayOfWeek]} ${form.startTime} already has a class in this group.`); return; }
    try {
      const endTime = addHours(form.startTime, form.isLab ? form.labDuration : 1);
      const payload = { ...form, group: form.classroom, endTime, teacher: form.isLab ? undefined : form.teacher || undefined, teachers: form.isLab ? form.teachers : [] };
      await api.post("/schedules", payload);
      setShowAddSlot(false);
      setForm({ classroom: "", course: "", teacher: "", teachers: [], dayOfWeek: 0, startTime: "09:00", room: "", semester: 1, isLab: false, labDuration: 2 });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add slot");
    }
  };

  const handleCancel = async () => {
    try {
      // ✅ FIX: Now passing the correct computed 'date' to the backend so it cancels on the exact day clicked!
      await api.post(`/schedules/${showCancelModal._id}/cancel`, { 
        reason: cancelReason,
        date: showCancelModal.targetDate 
      });
      setCancelReason("");
      setShowCancelModal(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const handleDeletePermanent = async (slotId) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this class from the base routine?")) return;
    try {
      await api.delete(`/schedules/${slotId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleExtraRequest = async () => {
    const targetGroup = showExtraModal.classroom?._id || showExtraModal.classroom || extraClassroom;
    if (!targetGroup) { alert("Please select a group."); return; }
    if (!extraReason.trim()) { alert("Please provide a reason."); return; }

    try {
      await api.post("/schedules/extra-class-request", {
        targetGroup, emptySlot: showExtraModal._id || undefined, course: extraCourse || undefined,
        reason: extraReason, requestedDate: showExtraModal.requestedDate, dayOfWeek: showExtraModal.dayOfWeek,
        startTime: showExtraModal.startTime, endTime: showExtraModal.endTime 
      });
      
      const isAutoApprove = ['class_rep', 'admin'].includes(user?.role);
      closeExtraModal();
      alert(isAutoApprove ? "Temporary Class successfully added!" : "Temporary Class request sent to CR for approval!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const closeExtraModal = () => {
    setShowExtraModal(null);
    setExtraReason(""); setExtraCourse(""); setExtraClassroom(""); setCourses([]);
  };

  if (loading && slots.length === 0) {
    return <div className="flex justify-center py-20"><UniLifeLoader/></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             Group Schedule
             {isEditMode && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-lg font-bold uppercase tracking-wide">Permanent Edit Mode</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode 
              ? "You are currently editing the base routine. Changes here are permanent." 
              : isTeacher ? "Your teaching schedule across all groups (including temporary changes)" : "Your group routine schedule (including temporary changes)"}
          </p>
        </div>

        {isManager && (
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                 isEditMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                 {isEditMode ? <Settings className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                 {isEditMode ? "Editing Permanent Routine" : "Manage Routine"}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`} />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 flex flex-col overflow-hidden">
                {!isEditMode && (
                  <>
                    <button
                      onClick={() => { setForm({ ...form, isLab: false }); setShowAddSlot(true); setShowAddMenu(false); }}
                      className="px-5 py-3 text-left text-sm hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-blue-500" /> Add Regular Class
                    </button>
                    <button
                      onClick={() => { setForm({ ...form, isLab: true }); setShowAddSlot(true); setShowAddMenu(false); }}
                      className="px-5 py-3 text-left text-sm hover:bg-gray-50 font-bold text-gray-700 flex items-center gap-2 border-b border-gray-50"
                    >
                      <Plus className="w-4 h-4 text-purple-500" /> Add Lab
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setIsEditMode(!isEditMode); setShowAddMenu(false); }}
                  className={`px-5 py-3 text-left text-sm font-bold flex items-center gap-2 ${
                     isEditMode ? "text-blue-600 hover:bg-blue-50" : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <Settings className="w-4 h-4" /> {isEditMode ? "Exit Edit Mode" : "Edit Routine"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-4 text-xs flex-wrap">
        {[{ color: "bg-blue-100 border-blue-200", label: "Regular class" }, { color: "bg-purple-100 border-purple-200", label: "Lab" }, { color: "bg-red-100 border-red-300", label: "Cancelled (Temp)" }, { color: "bg-green-100 border-green-200", label: "Extra (Temp)" }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded border ${color}`} /><span className="text-gray-500">{label}</span></div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase border-r border-gray-200">Time</th>
                {DAYS.map((day, i) => (
                  <th key={day} className={`px-3 py-3 text-center text-xs font-semibold uppercase border-r border-gray-200 last:border-r-0 ${i === todayIdx && !isEditMode ? "bg-blue-50 text-blue-700" : "text-gray-500"}`}>
                    {day} {i === todayIdx && !isEditMode && <span className="ml-1 text-blue-400 normal-case font-normal">(Today)</span>}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {TIME_SLOTS.map((time, ti) => (
                <tr key={time} className={`${ti % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                  <td className="px-2 py-1 border-b border-r border-gray-200 text-xs font-medium text-gray-400 whitespace-nowrap align-middle text-center">{fmtTime(time)}</td>

                  {DAYS.map((day, di) => {
                    const cellKey = `${day}-${time}`;
                    if (coveredCells.has(cellKey)) return null;

                    const slot = slotGrid[day][time];
                    const isToday = di === todayIdx && !isEditMode;
                    const rowSpan = slot ? slotRowSpan(slot) : 1;
                    const styles = slot?.isLab ? LAB_STYLES[slot.status] || LAB_STYLES.scheduled : STATUS_STYLES[slot?.status] || "";

                    // ✅ FIX: Calculate the exact ISO date for the specific grid cell being clicked/rendered
                    const targetDateObj = new Date();
                    targetDateObj.setDate(targetDateObj.getDate() + (di - targetDateObj.getDay()));
                    const yyyy = targetDateObj.getFullYear();
                    const mm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(targetDateObj.getDate()).padStart(2, '0');
                    const localDateStr = `${yyyy}-${mm}-${dd}`;

                    return (
                      <td key={day} rowSpan={rowSpan} className={`px-1.5 py-1.5 border-b border-r border-gray-200 last:border-r-0 min-w-[150px] h-px ${isToday ? "bg-blue-50/20" : ""}`}>
                        {slot ? (
                          <SlotCard
                            slot={slot} styles={styles}
                            isTeacher={canEditSlot(slot)} 
                            isEditMode={isEditMode}
                            // ✅ FIX: Attach the calculated localDateStr so CancelModal knows exactly which day to cancel
                            onCancel={() => setShowCancelModal({ ...slot, targetDate: localDateStr })}
                            onDeletePermanent={() => handleDeletePermanent(slot._id)}
                            onRequestExtra={() => {
                              if (slot.status !== "cancelled" && slot.status !== "empty") {
                                alert("This cell is occupied. You must cancel the current class before requesting a temporary class here.");
                                return;
                              }
                              setShowExtraModal({ ...slot, requestedDate: localDateStr });
                              fetchCoursesFor(slot.classroom?._id || slot.classroom);
                            }}
                          />
                        ) : isManager ? (
                          <button
                            onClick={() => {
                              if (isEditMode) {
                                setForm({ ...form, dayOfWeek: di, startTime: time, isLab: false });
                                setShowAddSlot(true);
                              } else {
                                const eIdx = TIME_SLOTS.indexOf(time) + 1;
                                const calculatedEndTime = TIME_SLOTS[eIdx] || "17:00";

                                setShowExtraModal({ _id: null, dayOfWeek: di, startTime: time, endTime: calculatedEndTime, classroom: null, status: "empty", requestedDate: localDateStr });
                                setCourses([]);
                                setExtraClassroom("");
                              }
                            }}
                            className={`h-full min-h-[52px] w-full rounded-lg border border-dashed hover:bg-opacity-50 flex items-center justify-center group transition-colors ${
                               isEditMode ? "border-red-200 hover:border-red-400 hover:bg-red-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <Plus className={`w-3.5 h-3.5 transition-colors ${isEditMode ? "text-red-300 group-hover:text-red-500" : "text-gray-200 group-hover:text-blue-400"}`} />
                          </button>
                        ) : (
                          <div className="h-full min-h-[52px] w-full rounded-lg flex items-center justify-center"><span className="text-gray-200 text-xs">-</span></div>
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

      <AddSlotModal show={showAddSlot} onClose={() => setShowAddSlot(false)} form={form} setForm={setForm} classrooms={classrooms} courses={courses} teachers={teachers} fetchCoursesFor={fetchCoursesFor} onAdd={handleAddSlot} />
      <CancelModal show={!!showCancelModal} slot={showCancelModal} onClose={() => setShowCancelModal(null)} onConfirm={handleCancel} reason={cancelReason} setReason={setCancelReason} />
      <ExtraRequestModal show={!!showExtraModal} slot={showExtraModal} onClose={closeExtraModal} onConfirm={handleExtraRequest} reason={extraReason} setReason={setExtraReason} course={extraCourse} setCourse={setExtraCourse} classroom={extraClassroom} setClassroom={setExtraClassroom} classrooms={classrooms} courses={courses} fetchCoursesFor={fetchCoursesFor} />
    </div>
  );
};

export default SchedulePage;