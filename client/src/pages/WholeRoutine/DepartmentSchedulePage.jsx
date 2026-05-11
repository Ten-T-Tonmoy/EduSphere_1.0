import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/Authcontext";
import api from "../../utils/Api";
import {
  DAYS,
  TIME_SLOTS,
  rowSpan,
  buildGrid,
  getCoveredCells,
} from "./DeptScheduleUtils";

import DeptHeader from "./DeptHeader";
import DeptLegend from "./DeptLegend";
import DeptDayTable from "./DeptDayTable";
import DeptExtraModal from "./DeptExtraModal";
import { DeptEmptyState } from "./DeptEmptyState";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";

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

  // Sorting mapped properly for Groups instead of Classrooms
  const rowGroups = useMemo(() => {
    return [...data.classrooms].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [data.classrooms]);

  useEffect(() => {
    // Only fetch if the user is a teacher or admin
    if (department && (user?.role === "teacher" || user?.role === "admin")) {
      fetchDeptSchedule();
    }
  }, [department, user?.role]);

  // RESTRICT ACCESS: Block students from viewing the Dept Routine
  if (user?.role !== "teacher" && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-in fade-in zoom-in duration-300">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-500 font-medium">
          Only Teachers can view the Department Routine.
        </p>
      </div>
    );
  }

  const fetchDeptSchedule = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await api.get(
        `/schedules/department/${encodeURIComponent(department)}?date=${today}`,
      );
      console.log(res);
      // Ensure backend 'group' populates map properly to 'classroom' variables for UI components
      const formattedSlots = res.data.slots.map((slot) => ({
        ...slot,
        classroom: slot.group || slot.classroom,
      }));
      setData({ slots: formattedSlots, classrooms: res.data.classrooms });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesFor = async (groupId) => {
    if (!groupId) return;
    try {
      // Fetch syllabus by Group ID
      const res = await api.get(`/syllabus/group/${groupId}`);
      const all = res.data;
      const filtered =
        user?.role === "teacher"
          ? all.filter(
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

  const handleExtraRequest = async () => {
    if (!extraForm.reason.trim()) {
      alert("Please provide a reason.");
      return;
    }
    setSubmitting(true);
    try {
      // Connect specifically to targetGroup logic mapped correctly
      await api.post("/schedules/extra-class-request", {
        targetGroup: showExtraModal.classroom?._id || showExtraModal.classroom,
        emptySlot: showExtraModal._id || undefined,
        course: extraForm.course || undefined,
        reason: extraForm.reason,
        // Ensure requested date maps to the exact column clicked
        requestedDate: showExtraModal.requestedDate || extraForm.requestedDate,
        dayOfWeek: showExtraModal.dayOfWeek,
        startTime: showExtraModal.startTime,
        endTime: showExtraModal.endTime,
      });
      setShowExtraModal(null);
      setCourses([]);
      alert("Temporary class request sent successfully to the group CR!");
      // Re-fetch to show the "Pending" state if the teacher is part of that group
      fetchDeptSchedule();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (dept) => {
    setDepartment(dept);
  };

  const grid = useMemo(() => {
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

  const coveredCells = useMemo(() => {
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

  // Handle clicking an empty cell for a specific day/group
  const handleEmptySlotClick = (classroom, dayIdx, time) => {
    // Exactly calculate the date of the column clicked
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (dayIdx - targetDate.getDay()));
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const localDateStr = `${yyyy}-${mm}-${dd}`;

    const eIdx = TIME_SLOTS.indexOf(time) + 1;
    const calculatedEndTime = TIME_SLOTS[eIdx] || "17:00";

    setShowExtraModal({
      _id: null,
      dayOfWeek: dayIdx,
      startTime: time,
      endTime: calculatedEndTime,
      classroom: classroom,
      status: "empty",
      requestedDate: localDateStr,
    });
    fetchCoursesFor(classroom._id);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <UniLifeLoader size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto">
      <DeptHeader
        department={department}
        onSearch={handleSearch}
        deptInput={deptInput}
        setDeptInput={setDeptInput}
      />

      {!department && <DeptEmptyState type="no-department" />}

      {department && data.classrooms.length === 0 && (
        <DeptEmptyState department={department} type="no-classrooms" />
      )}

      {data.classrooms.length > 0 && (
        <>
          <DeptLegend />

          {DAYS.map((day, dayIdx) => {
            const isToday = dayIdx === todayIdx;
            const isCollapsed = collapsedDays[day];

            return (
              <DeptDayTable
                key={day}
                day={day}
                dayIdx={dayIdx}
                isToday={isToday}
                isCollapsed={isCollapsed}
                onToggle={() => toggleDay(day)}
                classrooms={data.classrooms}
                grid={grid}
                coveredCells={coveredCells}
                rowGroups={rowGroups}
                onEmptySlotClick={handleEmptySlotClick}
                onRequestExtra={openExtraModal}
              />
            );
          })}
        </>
      )}

      <DeptExtraModal
        show={!!showExtraModal}
        slot={showExtraModal}
        onClose={() => {
          setShowExtraModal(null);
          setCourses([]);
        }}
        onConfirm={handleExtraRequest}
        form={extraForm}
        setForm={setExtraForm}
        courses={courses}
        submitting={submitting}
        userRole={user?.role}
      />
    </div>
  );
};

export default DepartmentSchedulePage;
