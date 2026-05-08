import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/Authcontext";
import api from "../../utils/Api";
import { Plus, XCircle, X, FlaskConical } from "lucide-react";

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const DAY_IDX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4 };

const fmtTime = (t) => {
  const [h] = t.split(":").map(Number);
  return h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
};

const slotLabel = (start, end) => `${fmtTime(start)} – ${fmtTime(end)}`;

const addHours = (time, hours) => {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const slotRowSpan = (slot) => (slot.isLab ? slot.labDuration || 2 : 1);

const STATUS_STYLES = {
  scheduled: "bg-blue-50 border-blue-200",
  cancelled: "bg-red-50 border-red-300",
  extra: "bg-green-50 border-green-200",
};

const LAB_STYLES = {
  scheduled: "bg-purple-50 border-purple-200",
  cancelled: "bg-red-50 border-red-300",
  extra: "bg-green-50 border-green-200",
};

const getCoveredCells = (slots) => {
  const covered = new Set();
  slots.forEach((slot) => {
    if (slotRowSpan(slot) > 1) {
      const day = DAYS[slot.dayOfWeek];
      const startIdx = TIME_SLOTS.indexOf(slot.startTime);
      for (let i = 1; i < slotRowSpan(slot); i++) {
        if (TIME_SLOTS[startIdx + i]) {
          covered.add(`${day}-${TIME_SLOTS[startIdx + i]}`);
        }
      }
    }
  });
  return covered;
};

const SchedulePage = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showExtraModal, setShowExtraModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [extraReason, setExtraReason] = useState("");
  const [extraCourse, setExtraCourse] = useState("");
  const [extraClassroom, setExtraClassroom] = useState(""); // ← NEW

  const [form, setForm] = useState({
    classroom: "",
    course: "",
    teacher: "",
    teachers: [],
    dayOfWeek: 0,
    startTime: "09:00",
    room: "",
    semester: 1,
    isLab: false,
    labDuration: 2,
  });

  const isTeacher = ["teacher", "admin"].includes(user?.role);
  const isManager = ["teacher", "admin", "class_rep"].includes(user?.role);
  const todayIdx = new Date().getDay();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoint = isTeacher ? "/schedules/teacher" : "/schedules/student";
      const today = new Date().toISOString().split("T")[0];
      const [schedRes, clsRes, teachRes] = await Promise.all([
        api.get(`${endpoint}?date=${today}`),
        api.get("/my-groups"),
        api.get("/users/teachers"),
      ]);
      //-------------------------------approved extra class------------------------
      setSlots(schedRes.data);
      setClassrooms(clsRes.data);
      setTeachers(teachRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesFor = async (classroomId) => {
    if (!classroomId) return;
    try {
      const res = await api.get(`/syllabus/classroom/${classroomId}`);
      setCourses(res.data);
    } catch {}
  };

  const slotGrid = {};
  DAYS.forEach((d) => {
    slotGrid[d] = {};
    TIME_SLOTS.forEach((t) => {
      slotGrid[d][t] = null;
    });
  });
  slots.forEach((slot) => {
    const day = DAYS[slot.dayOfWeek];
    if (day && TIME_SLOTS.includes(slot.startTime)) {
      slotGrid[day][slot.startTime] = slot;
    }
  });

  const coveredCells = getCoveredCells(slots);

  const toggleLabTeacher = (id) => {
    setForm((p) => ({
      ...p,
      teachers: p.teachers.includes(id)
        ? p.teachers.filter((t) => t !== id)
        : [...p.teachers, id],
    }));
  };

  const handleAddSlot = async () => {
    const conflict = slots.find(
      (s) =>
        s.classroom === form.classroom &&
        s.dayOfWeek === form.dayOfWeek &&
        s.startTime === form.startTime,
    );
    if (conflict) {
      alert(
        `Slot conflict! ${DAYS[form.dayOfWeek]} ${form.startTime} already has a class in this classroom.`,
      );
      return;
    }
    try {
      const endTime = addHours(
        form.startTime,
        form.isLab ? form.labDuration : 1,
      );
      const payload = {
        ...form,
        endTime,
        teacher: form.isLab ? undefined : form.teacher || undefined,
        teachers: form.isLab ? form.teachers : [],
      };
      await api.post("/schedules", payload);
      setShowAddSlot(false);
      setForm({
        classroom: "",
        course: "",
        teacher: "",
        teachers: [],
        dayOfWeek: 0,
        startTime: "09:00",
        room: "",
        semester: 1,
        isLab: false,
        labDuration: 2,
      });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add slot");
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/schedules/${showCancelModal._id}/cancel`, {
        reason: cancelReason,
      });
      setCancelReason("");
      setShowCancelModal(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  // ← UPDATED: handles both cancelled slots and empty slots
  const handleExtraRequest = async () => {
    const targetClassroom =
      showExtraModal.classroom?._id ||
      showExtraModal.classroom ||
      extraClassroom;

    if (!targetClassroom) {
      alert("Please select a classroom.");
      return;
    }
    if (!extraReason.trim()) {
      alert("Please provide a reason.");
      return;
    }

    try {
      await api.post("/schedules/extra-class-request", {
        targetClassroom,
        emptySlot: showExtraModal._id || undefined,
        course: extraCourse || undefined,
        reason: extraReason,
        requestedDate: new Date().toISOString().split("T")[0],
        dayOfWeek: showExtraModal.dayOfWeek,
        startTime: showExtraModal.startTime,
      });
      setExtraReason("");
      setExtraCourse("");
      setExtraClassroom("");
      setCourses([]);
      setShowExtraModal(null);
      alert("Extra class request sent!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const closeExtraModal = () => {
    setShowExtraModal(null);
    setExtraReason("");
    setExtraCourse("");
    setExtraClassroom("");
    setCourses([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTeacher
              ? "Your teaching schedule across all classrooms"
              : "Your weekly class timetable"}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowAddSlot(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs flex-wrap">
        {[
          { color: "bg-blue-100 border-blue-200", label: "Regular class" },
          { color: "bg-purple-100 border-purple-200", label: "Lab" },
          { color: "bg-red-100 border-red-300", label: "Cancelled" },
          { color: "bg-green-100 border-green-200", label: "Extra" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${color}`} />
            <span className="text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase border-r border-gray-200">
                  Time
                </th>
                {DAYS.map((day, i) => (
                  <th
                    key={day}
                    className={`px-3 py-3 text-center text-xs font-semibold uppercase border-r border-gray-200 last:border-r-0 ${
                      i === todayIdx
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-500"
                    }`}
                  >
                    {day}
                    {i === todayIdx && (
                      <span className="ml-1 text-blue-400 normal-case font-normal">
                        (Today)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {TIME_SLOTS.map((time, ti) => (
                <tr
                  key={time}
                  className={`${ti % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                >
                  <td className="px-2 py-1 border-b border-r border-gray-200 text-xs font-medium text-gray-400 whitespace-nowrap align-middle text-center">
                    {fmtTime(time)}
                  </td>

                  {DAYS.map((day, di) => {
                    const cellKey = `${day}-${time}`;
                    if (coveredCells.has(cellKey)) return null;

                    const slot = slotGrid[day][time];
                    const isToday = di === todayIdx;
                    const rowSpan = slot ? slotRowSpan(slot) : 1;
                    const styles = slot?.isLab
                      ? LAB_STYLES[slot.status] || LAB_STYLES.scheduled
                      : STATUS_STYLES[slot?.status] || "";

                    return (
                      <td
                        key={day}
                        rowSpan={rowSpan}
                        className={`px-1.5 py-1.5 border-b border-r border-gray-200 last:border-r-0 min-w-[150px] h-px ${
                          isToday ? "bg-blue-50/20" : ""
                        }`}
                      >
                        {slot ? (
                          <SlotCard
                            slot={slot}
                            styles={styles}
                            isTeacher={isTeacher}
                            onCancel={() => setShowCancelModal(slot)}
                            onRequestExtra={() => {
                              setShowExtraModal(slot);
                              fetchCoursesFor(
                                slot.classroom?._id || slot.classroom,
                              );
                            }}
                          />
                        ) : (
                          // ── empty cell → click to request a class ──
                          <button
                            onClick={() => {
                              setShowExtraModal({
                                _id: null,
                                dayOfWeek: di,
                                startTime: time,
                                classroom: null,
                                status: "empty",
                              });
                              setCourses([]);
                              setExtraClassroom("");
                            }}
                            className="h-full min-h-[52px] w-full rounded-lg border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center group transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-gray-200 group-hover:text-blue-400 transition-colors" />
                          </button>
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

      {/* ── ADD SLOT MODAL ── */}
      {showAddSlot && (
        <Modal title="Add Class Slot" onClose={() => setShowAddSlot(false)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <button
                onClick={() => setForm((p) => ({ ...p, isLab: false }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !form.isLab
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border"
                }`}
              >
                Regular Class
              </button>
              <button
                onClick={() => setForm((p) => ({ ...p, isLab: true }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  form.isLab
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-600 border"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" /> Lab
              </button>
            </div>

            <div>
              <label className="label">Classroom / Batch</label>
              <select
                className="input"
                value={form.classroom}
                onChange={(e) => {
                  setForm((p) => ({ ...p, classroom: e.target.value }));
                  fetchCoursesFor(e.target.value);
                }}
              >
                <option value="">Select classroom</option>
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Course</label>
              <select
                className="input"
                value={form.course}
                onChange={(e) =>
                  setForm((p) => ({ ...p, course: e.target.value }))
                }
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Day</label>
                <select
                  className="input"
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      dayOfWeek: parseInt(e.target.value),
                    }))
                  }
                >
                  {DAYS.map((d) => (
                    <option key={d} value={DAY_IDX[d]}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Start Time</label>
                <select
                  className="input"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {fmtTime(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.isLab && (
              <div>
                <label className="label">Lab Duration</label>
                <div className="flex gap-2">
                  {[2, 3].map((h) => (
                    <button
                      key={h}
                      onClick={() => setForm((p) => ({ ...p, labDuration: h }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.labDuration === h
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-600 border-gray-300"
                      }`}
                    >
                      {h} hours
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!form.isLab ? (
              <div>
                <label className="label">Teacher</label>
                <select
                  className="input"
                  value={form.teacher}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, teacher: e.target.value }))
                  }
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} — {t.department || t.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">
                  Lab Teachers{" "}
                  <span className="text-gray-400 font-normal">
                    (select multiple)
                  </span>
                </label>
                <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                  {teachers.map((t) => (
                    <label
                      key={t._id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.teachers.includes(t._id)}
                        onChange={() => toggleLabTeacher(t._id)}
                        className="rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {t.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {t.department || t.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {form.teachers.length > 0 && (
                  <p className="text-xs text-purple-600 mt-1">
                    {form.teachers.length} teacher
                    {form.teachers.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="label">Room / Lab</label>
              <input
                className="input"
                placeholder="e.g. Lab-3, Room 201"
                value={form.room}
                onChange={(e) =>
                  setForm((p) => ({ ...p, room: e.target.value }))
                }
              />
            </div>
          </div>

          <ModalFooter
            onConfirm={handleAddSlot}
            onCancel={() => setShowAddSlot(false)}
            confirmLabel="Add Slot"
            confirmClass={`${form.isLab ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
          />
        </Modal>
      )}

      {/* ── CANCEL MODAL ── */}
      {showCancelModal && (
        <Modal title="Cancel Class" onClose={() => setShowCancelModal(null)}>
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-medium">{showCancelModal.course?.name}</span>{" "}
            — {DAYS[showCancelModal.dayOfWeek]} {showCancelModal.startTime}
          </p>
          <label className="label">Reason for cancellation</label>
          <textarea
            className="input"
            rows={3}
            placeholder="e.g. Teacher unwell, departmental meeting..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <ModalFooter
            onConfirm={handleCancel}
            onCancel={() => setShowCancelModal(null)}
            confirmLabel="Cancel Class"
            confirmClass="bg-red-600 hover:bg-red-700 text-white"
          />
        </Modal>
      )}

      {/* ── EXTRA CLASS REQUEST MODAL ── */}
      {showExtraModal && (
        <Modal title="Request Extra Class" onClose={closeExtraModal}>
          {/* Slot info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
            <p>
              <span className="font-medium">Slot: </span>
              {DAYS[showExtraModal.dayOfWeek]} · {showExtraModal.startTime}
            </p>
            {showExtraModal.classroom?.name && (
              <p>
                <span className="font-medium">Classroom: </span>
                {showExtraModal.classroom.name}
              </p>
            )}
            {showExtraModal.cancellationReason && (
              <p className="text-red-600 text-xs mt-1 italic">
                Cancelled: {showExtraModal.cancellationReason}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {/* ← Classroom selector — only shown for empty slots */}
            {showExtraModal.status === "empty" && (
              <div>
                <label className="label">Classroom *</label>
                <select
                  className="input"
                  value={extraClassroom}
                  onChange={(e) => {
                    setExtraClassroom(e.target.value);
                    fetchCoursesFor(e.target.value);
                  }}
                >
                  <option value="">Select classroom</option>
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Course — only shown once a classroom is selected or slot already has one */}
            {(showExtraModal.status !== "empty" || extraClassroom) && (
              <div>
                <label className="label">Course (optional)</label>
                <select
                  className="input"
                  value={extraCourse}
                  onChange={(e) => setExtraCourse(e.target.value)}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Reason *</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Why do you need this extra class?"
                value={extraReason}
                onChange={(e) => setExtraReason(e.target.value)}
              />
            </div>
          </div>

          <ModalFooter
            onConfirm={handleExtraRequest}
            onCancel={closeExtraModal}
            confirmLabel="Send Request"
          />
        </Modal>
      )}
    </div>
  );
};

// ── Slot card ───────────────────────────────────────────────────────────────

const SlotCard = ({ slot, styles, isTeacher, onCancel, onRequestExtra }) => {
  const allTeachers = slot.isLab
    ? slot.teachers || []
    : slot.teacher
      ? [slot.teacher]
      : [];

  return (
    <div
      className={`rounded-lg border p-2 text-xs h-full flex flex-col gap-0.5 ${styles}`}
    >
      {slot.isLab && (
        <div className="flex items-center gap-1 mb-0.5">
          <FlaskConical className="w-3 h-3 text-purple-600" />
          <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">
            Lab · {slot.labDuration}h
          </span>
        </div>
      )}

      <p className="font-semibold text-sm leading-tight truncate">
        {slot.course?.name || "Unnamed"}
      </p>
      {slot.course?.code && (
        <p className="text-[10px] opacity-50">{slot.course.code}</p>
      )}

      {allTeachers.length > 0 && (
        <div className="mt-0.5">
          {allTeachers.map((t, i) => (
            <p key={t._id || i} className="truncate opacity-70 text-[11px]">
              👤 {t.name || t}
            </p>
          ))}
        </div>
      )}

      {slot.classroom?.name && (
        <p className="truncate opacity-60 text-[11px]">
          🏫 {slot.classroom.name}
        </p>
      )}

      {slot.room && <p className="opacity-50 text-[11px]">📍 {slot.room}</p>}

      {slot.status === "cancelled" && (
        <div className="mt-1">
          <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            CANCELLED
          </span>
          {slot.cancellationReason && (
            <p className="text-[10px] opacity-60 mt-0.5 italic line-clamp-2">
              {slot.cancellationReason}
            </p>
          )}
        </div>
      )}
      {slot.status === "extra" && (
        <span className="mt-1 inline-block bg-green-200 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
          EXTRA
        </span>
      )}

      <div className="mt-auto pt-1.5 flex gap-1 flex-wrap">
        {isTeacher && slot.status === "scheduled" && (
          <button
            onClick={onCancel}
            className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors"
          >
            <XCircle className="w-2.5 h-2.5" /> Cancel
          </button>
        )}
        {slot.status === "cancelled" && (
          <button
            onClick={onRequestExtra}
            className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors"
          >
            <Plus className="w-2.5 h-2.5" /> Request Extra
          </button>
        )}
      </div>
    </div>
  );
};

// ── Modal shell ─────────────────────────────────────────────────────────────

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter = ({
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  confirmClass = "bg-blue-600 hover:bg-blue-700 text-white",
}) => (
  <div className="flex gap-2 mt-4">
    <button
      onClick={onConfirm}
      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${confirmClass}`}
    >
      {confirmLabel}
    </button>
    <button
      onClick={onCancel}
      className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      Cancel
    </button>
  </div>
);

export default SchedulePage;
