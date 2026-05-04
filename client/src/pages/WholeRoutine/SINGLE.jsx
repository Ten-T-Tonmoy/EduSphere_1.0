import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/Authcontext";
import api from "../../utils/Api";
import { Building2, ChevronDown, Plus, X } from "lucide-react";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";

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

const fmtTime = (t) => {
  const [h] = t.split(":").map(Number);
  return h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
};

const STATUS_BG = {
  scheduled: {
    regular: "bg-blue-50 border-blue-200 text-blue-900",
    lab: "bg-purple-50 border-purple-200 text-purple-900",
  },
  cancelled: "bg-red-50 border-red-200 text-red-800",
  extra: "bg-green-50 border-green-200 text-green-900",
};

const rowSpan = (slot) => (slot.isLab ? slot.labDuration || 2 : 1);

// ── Modal shell ──────────────────────────────────────────────────────────────
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
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

// ── Main component ───────────────────────────────────────────────────────────
const DepartmentSchedulePage = () => {
  const { user } = useAuth();

  const [department, setDepartment] = useState(user?.department || "");
  const [deptInput, setDeptInput] = useState(user?.department || "");
  const [data, setData] = useState({ slots: [], classrooms: [] });
  const [loading, setLoading] = useState(false);

  const todayName = DAYS[new Date().getDay()];
  const [collapsedDays, setCollapsedDays] = useState(
    Object.fromEntries(
      DAYS.map((d) => [d, todayName ? d !== todayName : false]),
    ),
  );

  const [showExtraModal, setShowExtraModal] = useState(null);
  const [courses, setCourses] = useState([]);
  const [extraForm, setExtraForm] = useState({
    course: "",
    reason: "",
    requestedDate: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const rowGroups = React.useMemo(() => {
    return [...data.classrooms].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.currentSemester - b.currentSemester;
    });
  }, [data.classrooms]);

  useEffect(() => {
    if (department) fetchDeptSchedule();
  }, [department]);

  const fetchDeptSchedule = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await api.get(
        `/schedules/department/${encodeURIComponent(department)}?date=${today}`, // ← add date
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ← fixed path + teacher course filter
  const fetchCoursesFor = async (classroomId) => {
    if (!classroomId) return;
    try {
      const res = await api.get(`/syllabus/classroom/${classroomId}`);
      const all = res.data;
      const filtered =
        user?.role === "teacher"
          ? all.filter(
              //   (c) => c.teacher?._id === user._id || c.teacher === user._id,
              (c) =>
                String(c.teacher?._id) === String(user._id) ||
                String(c.teacher) === String(user._id),
            )
          : all;
      setCourses(filtered);
    } catch {}
  };

  const openExtraModal = (slot) => {
    setShowExtraModal(slot);
    setExtraForm({
      course: "",
      reason: "",
      requestedDate: new Date().toISOString().split("T")[0],
    });
    fetchCoursesFor(slot.classroom?._id || slot.classroom);
  };

  // ← handles both cancelled and empty slots
  const handleExtraRequest = async () => {
    if (!extraForm.reason.trim()) {
      alert("Please provide a reason.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/schedules/extra-class-request", {
        targetClassroom:
          showExtraModal.classroom?._id || showExtraModal.classroom,
        emptySlot: showExtraModal._id || undefined,
        course: extraForm.course || undefined,
        reason: extraForm.reason,
        requestedDate: extraForm.requestedDate,
        dayOfWeek: showExtraModal.dayOfWeek,
        startTime: showExtraModal.startTime,
      });
      setShowExtraModal(null);
      setCourses([]);
      alert("Extra class request sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setDepartment(deptInput.trim());
  };

  const grid = React.useMemo(() => {
    const g = {};
    data.classrooms.forEach((cls) => {
      g[cls._id] = {};
      DAYS.forEach((_, di) => {
        g[cls._id][di] = {};
        TIME_SLOTS.forEach((t) => {
          g[cls._id][di][t] = null;
        });
      });
    });
    data.slots.forEach((slot) => {
      const cid = slot.classroom?._id || slot.classroom;
      const day = slot.dayOfWeek;
      const time = slot.startTime;
      if (g[cid]?.[day]?.[time] !== undefined) {
        g[cid][day][time] = slot;
      }
    });
    return g;
  }, [data]);

  const coveredCells = React.useMemo(() => {
    const covered = new Set();
    data.slots.forEach((slot) => {
      if (rowSpan(slot) > 1) {
        const cid = slot.classroom?._id || slot.classroom;
        const startIdx = TIME_SLOTS.indexOf(slot.startTime);
        for (let i = 1; i < rowSpan(slot); i++) {
          if (TIME_SLOTS[startIdx + i]) {
            covered.add(`${cid}-${slot.dayOfWeek}-${TIME_SLOTS[startIdx + i]}`);
          }
        }
      }
    });
    return covered;
  }, [data.slots]);

  const toggleDay = (day) =>
    setCollapsedDays((p) => ({ ...p, [day]: !p[day] }));

  const todayIdx = new Date().getDay();

  const renderSlot = (slot) => {
    if (!slot) return null;

    const allTeachers = slot.isLab
      ? slot.teachers || []
      : slot.teacher
        ? [slot.teacher]
        : [];

    const style =
      slot.status === "cancelled"
        ? STATUS_BG.cancelled
        : slot.status === "extra"
          ? STATUS_BG.extra
          : slot.isLab
            ? STATUS_BG.scheduled.lab
            : STATUS_BG.scheduled.regular;

    return (
      <div
        className={`rounded border p-1.5 text-[11px] h-full flex flex-col gap-0.5 ${style}`}
      >
        {slot.isLab && (
          <p className="text-[9px] font-bold uppercase tracking-wide text-purple-600">
            Lab {slot.labDuration}h
          </p>
        )}

        <p className="font-semibold leading-tight truncate">
          {slot.course?.name || "—"}
        </p>

        {slot.course?.code && (
          <p className="opacity-50 text-[9px]">{slot.course.code}</p>
        )}

        {allTeachers.length > 0 && (
          <p className="opacity-70 truncate">
            {allTeachers.map((t) => t.name).join(", ")}
          </p>
        )}

        {slot.room && <p className="opacity-50">[{slot.room}]</p>}

        {slot.status === "cancelled" && (
          <>
            <p className="text-red-600 font-bold text-[9px]">CANCELLED</p>
            {slot.cancellationReason && (
              <p className="text-[9px] opacity-60 italic line-clamp-1">
                {slot.cancellationReason}
              </p>
            )}
            <button
              onClick={() => openExtraModal(slot)}
              className="mt-auto flex items-center gap-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded transition-colors w-fit"
            >
              <Plus className="w-2.5 h-2.5" />
              Request Extra
            </button>
          </>
        )}

        {slot.status === "extra" && (
          <p className="text-green-700 font-bold text-[9px]">EXTRA</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Department Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Full routine across all years, batches and classrooms
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            placeholder="e.g. ICE, ICE, EEE"
            value={deptInput}
            onChange={(e) => setDeptInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Load
          </button>
        </form>
      </div>

      {!department && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Enter your department name above to load the full routine.</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <UniLifeLoader size="md" />
        </div>
      )}

      {!loading && department && data.classrooms.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
          <p>No classrooms found for department "{department}".</p>
          <p className="text-sm mt-1">
            Make sure classrooms have the correct department set.
          </p>
        </div>
      )}

      {!loading && data.classrooms.length > 0 && (
        <>
          {/* Legend */}
          <div className="flex gap-4 mb-3 text-xs flex-wrap">
            {[
              { color: "bg-blue-100 border-blue-200", label: "Regular" },
              { color: "bg-purple-100 border-purple-200", label: "Lab" },
              { color: "bg-red-100 border-red-200", label: "Cancelled" },
              { color: "bg-green-100 border-green-200", label: "Extra" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded border ${color}`} />
                <span className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* One table per day */}
          {DAYS.map((day, dayIdx) => {
            const isToday = dayIdx === todayIdx;
            const isCollapsed = collapsedDays[day];
            const hasSlots = data.slots.some((s) => s.dayOfWeek === dayIdx);

            return (
              <div
                key={day}
                className={`mb-4 rounded-xl border overflow-hidden shadow-sm ${
                  isToday ? "border-blue-400" : "border-gray-200"
                }`}
              >
                {/* Day header */}
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-sm transition-colors ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {day}
                    {isToday && (
                      <span className="text-blue-200 font-normal text-xs">
                        Today
                      </span>
                    )}
                    {!hasSlots && (
                      <span
                        className={`text-xs font-normal ${
                          isToday ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        — no classes
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-2 py-2 text-left font-semibold text-gray-500 border-r border-gray-200 w-12 whitespace-nowrap">
                            Year
                          </th>
                          <th className="px-2 py-2 text-left font-semibold text-gray-500 border-r border-gray-200 w-12 whitespace-nowrap">
                            Sem
                          </th>
                          <th className="px-2 py-2 text-left font-semibold text-gray-500 border-r border-gray-200 w-28">
                            Batch
                          </th>
                          {TIME_SLOTS.map((t, ti) => (
                            <th
                              key={t}
                              className="px-2 py-2 text-center font-semibold text-gray-500 border-r border-gray-200 last:border-r-0 min-w-[130px] whitespace-nowrap"
                            >
                              {fmtTime(t)}
                              <span className="text-gray-300 mx-0.5">–</span>
                              {fmtTime(TIME_SLOTS[ti + 1] || "17:00")}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {rowGroups.map((classroom, ri) => {
                          const cid = classroom._id;
                          return (
                            <tr
                              key={cid}
                              className={`border-b border-gray-100 ${
                                ri % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                              }`}
                            >
                              <td className="px-2 py-1.5 border-r border-gray-200 font-semibold text-gray-700 whitespace-nowrap align-middle">
                                {classroom.year}
                              </td>
                              <td className="px-2 py-1.5 border-r border-gray-200 text-gray-500 whitespace-nowrap align-middle">
                                {classroom.currentSemester}
                              </td>
                              <td className="px-2 py-1.5 border-r border-gray-200 font-medium text-gray-800 align-middle">
                                {classroom.name}
                              </td>

                              {TIME_SLOTS.map((time) => {
                                const cellKey = `${cid}-${dayIdx}-${time}`;
                                if (coveredCells.has(cellKey)) return null;

                                const slot = grid[cid]?.[dayIdx]?.[time];
                                const span = slot ? rowSpan(slot) : 1;

                                return (
                                  <td
                                    key={time}
                                    colSpan={span}
                                    className="px-1 py-1 border-r border-gray-200 last:border-r-0 align-top min-w-[130px]"
                                  >
                                    {slot ? (
                                      renderSlot(slot)
                                    ) : (
                                      // ── empty slot → request a class ──
                                      <button
                                        onClick={() => {
                                          setShowExtraModal({
                                            _id: null,
                                            dayOfWeek: dayIdx,
                                            startTime: time,
                                            endTime:
                                              TIME_SLOTS[
                                                TIME_SLOTS.indexOf(time) + 1
                                              ] || "17:00",
                                            classroom: classroom,
                                            status: "empty",
                                          });
                                          fetchCoursesFor(classroom._id);
                                        }}
                                        className="h-full min-h-[48px] w-full rounded border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center group transition-colors"
                                      >
                                        <Plus className="w-3 h-3 text-gray-200 group-hover:text-blue-400 transition-colors" />
                                      </button>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── Extra Class Request Modal ── */}
      {showExtraModal && (
        <Modal
          title="Request Extra Class"
          onClose={() => {
            setShowExtraModal(null);
            setCourses([]);
          }}
        >
          {/* Slot info summary */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
            <p>
              <span className="font-medium">Slot: </span>
              {DAYS[showExtraModal.dayOfWeek]} · {showExtraModal.startTime}–
              {showExtraModal.endTime}
            </p>
            <p>
              <span className="font-medium">Classroom: </span>
              {showExtraModal.classroom?.name}
            </p>
            {showExtraModal.cancellationReason && (
              <p className="text-red-600 text-xs mt-1 italic">
                Cancelled: {showExtraModal.cancellationReason}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {/* Date picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Extra Class *
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={extraForm.requestedDate}
                onChange={(e) =>
                  setExtraForm((p) => ({ ...p, requestedDate: e.target.value }))
                }
              />
            </div>

            {/* Course picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course (optional)
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={extraForm.course}
                onChange={(e) =>
                  setExtraForm((p) => ({ ...p, course: e.target.value }))
                }
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {courses.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  No courses found for this classroom
                  {user?.role === "teacher" ? " assigned to you" : ""}.
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Why do you need this extra class?"
                value={extraForm.reason}
                onChange={(e) =>
                  setExtraForm((p) => ({ ...p, reason: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleExtraRequest}
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
            <button
              onClick={() => {
                setShowExtraModal(null);
                setCourses([]);
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DepartmentSchedulePage;
