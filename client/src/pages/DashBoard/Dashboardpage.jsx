import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";
import api from "../../utils/Api";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";

import {
  BookOpen,
  MessageSquare,
  Bell,
  ClipboardList,
  FileText,
  Calendar,
  Users,
  ChevronRight,
  Plus,
  Key,
  TrendingUp,
  CheckSquare,
  Clock,
  ArrowRight,
  LayoutGrid,
  AlertCircle,
  VolumeX,
  Building2,
  User,
} from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [joinForm, setJoinForm] = useState({ groupName: "", pin: "" });
  const [createForm, setCreateForm] = useState({
    name: "",
    pin: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [todaySlots, setTodaySlots] = useState([]);

  // --- NEW: SCHEDULE & ALARM STATES ---
  const [firstClass, setFirstClass] = useState(null);
  const [nextClass, setNextClass] = useState(null);
  const [timeToNext, setTimeToNext] = useState(null); // in minutes
  const [appMuted, setAppMuted] = useState(false);
  const alarmPlayedRef = useRef({ 30: false, 15: false });
  const alarmSoundRef = useRef(
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
    ),
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupRes] = await Promise.all([api.get("/groups/my-groups")]);
      const extractedGroups =
        groupRes.data.groups?.map((item) => item.group).filter(Boolean) || [];
      setGroups(extractedGroups);

      const schedKey =
        user.role === "teacher" || user.role === "admin"
          ? "/schedules/teacher"
          : "/schedules/student";
      const schedRes = await api.get(schedKey);
      const today = new Date().getDay();

      const validSlots = schedRes.data.filter(
        (s) => s.dayOfWeek === today && s.status !== "cancelled",
      );

      // Sort slots by time to accurately determine the first/next class
      const sortedSlots = validSlots.sort((a, b) => {
        const tA = a.startTime.split(":").map(Number);
        const tB = b.startTime.split(":").map(Number);
        return tA[0] * 60 + tA[1] - (tB[0] * 60 + tB[1]);
      });

      setTodaySlots(sortedSlots);
      if (sortedSlots.length > 0) {
        setFirstClass(sortedSlots[0]); // Mark the very first class of the day
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: SMART ALARM & COUNTDOWN ENGINE ---
  useEffect(() => {
    if (todaySlots.length === 0) return;

    const calculateTimes = () => {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      // 1. Find the Next Upcoming or Currently Running Class
      const upcoming = todaySlots.find((slot) => {
        if (!slot.endTime) return false;
        const [eh, em] = slot.endTime.split(":").map(Number);
        return eh * 60 + em > currentMins;
      });

      setNextClass(upcoming || null);

      if (upcoming && upcoming.startTime && upcoming.endTime) {
        const [sh, sm] = upcoming.startTime.split(":").map(Number);
        const [eh, em] = upcoming.endTime.split(":").map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;

        const diffToStart = startMins - currentMins;
        setTimeToNext(diffToStart); // Negative means class is currently running

        // 2. CHECK SETTINGS FOR ALARMS AND MUTES
        const settings = JSON.parse(
          localStorage.getItem("unilife_settings"),
        ) || { alarmEnabled: true, muteEnabled: true };

        // Is this the FIRST class of the day?
        const isFirstClass = firstClass && upcoming._id === firstClass._id;

        // Auto Mute Logic (During the first class)
        if (
          settings.muteEnabled &&
          isFirstClass &&
          diffToStart <= 0 &&
          currentMins <= endMins
        ) {
          setAppMuted(true);
        } else {
          setAppMuted(false);
        }

        // Alarm Logic (Only for the first class)
        if (settings.alarmEnabled && isFirstClass) {
          if (diffToStart === 30 && !alarmPlayedRef.current[30]) {
            alarmSoundRef.current
              .play()
              .catch((e) => console.log("Audio blocked by browser"));
            alarmPlayedRef.current[30] = true;
          } else if (diffToStart === 15 && !alarmPlayedRef.current[15]) {
            alarmSoundRef.current
              .play()
              .catch((e) => console.log("Audio blocked by browser"));
            alarmPlayedRef.current[15] = true;
          }
        }
      }
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [todaySlots, firstClass]);

  const handleJoin = async () => {
    try {
      await api.post("/groups/join-request", {
        groupName: joinForm.groupName,
        pin: joinForm.pin,
        requestedRole: user.role,
      });
      setShowJoinModal(false);
      setJoinForm({ groupName: "", pin: "" });
      alert("Join request sent successfully! Wait for admin approval.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join group");
    }
  };

  const handleCreate = async () => {
    try {
      await api.post("/groups/create", createForm);
      setShowCreateModal(false);
      setCreateForm({ name: "", pin: "", description: "" });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  const isTeacher = ["teacher", "admin"].includes(user?.role);

  const groupActions = (group) => [
    {
      icon: MessageSquare,
      label: "Chat",
      to: `/chat/${group._id}`,
      state: { groupName: group.name, memberCount: group.members?.length || 0 },
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100",
    },
    {
      icon: Bell,
      label: "Notices",
      to: `/manage-groups`,
      color: "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100",
    },
    {
      icon: FileText,
      label: "Materials",
      to: `/notes/${group._id}`,
      color:
        "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-100",
    },
    {
      icon: BookOpen,
      label: "Syllabus",
      to: `/syllabus/${group._id}`,
      state: { groupName: group.name },
      color:
        "text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-100",
    },
    {
      icon: Calendar,
      label: "Calendar",
      to: `/calendar/${group._id}`,
      state: { groupName: group.name },
      color: "text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-100",
    },
    {
      icon: ClipboardList,
      label: "Matrix",
      to: `/manage-groups`,
      color:
        "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100",
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // NEW PERFECTED DASHBOARD LOADING UI
  if (loading) {
    return (
      <div className="min-min-h-svh bg-slate-50/50 flex flex-col items-center justify-center sm:p-6">
        <div className="relative flex flex-col items-center">
          {/* Your exact UniLifeLoader component */}
          <UniLifeLoader size="1.2" />

          <div className="mt-12 flex flex-col items-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              UniLife Dashboard
            </h2>
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                Synchronizing Workspace
              </p>
            </div>

            <p className="text-[10px] text-slate-400 font-medium mt-4 max-w-[200px] text-center leading-relaxed">
              Fetching your groups, schedule, and smart alarm engine...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-min-h-svh bg-slate-50/50 pb-16 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto  sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* 1. REFINED WELCOME BANNER */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <p className="text-slate-400 font-medium tracking-wide text-xs sm:text-sm mb-2 uppercase">
              {todayDateStr} • {user?.department}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">
              You are logged in as a{" "}
              <span className="capitalize font-semibold text-white">
                {user?.role?.replace("_", " ")}
              </span>
              . Here is your overview for today.
            </p>
          </div>

          <div className="relative z-10 flex gap-4 w-full md:w-auto">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex-1 md:w-32 text-center">
              <p className="text-2xl font-bold text-white">
                {todaySlots.length}
              </p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                Classes Today
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex-1 md:w-32 text-center">
              <p className="text-2xl font-bold text-white">{groups.length}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                Active Groups
              </p>
            </div>
          </div>
        </div>

        {/* --- NEW: ACTIVE MUTE BANNER --- */}
        {appMuted && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 animate-pulse shadow-sm">
            <VolumeX className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-900">
                Focus Mode Active
              </p>
              <p className="text-xs font-medium text-rose-700">
                Your first class is running. App notifications are muted.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* 2. NEW: SMART UP-NEXT WIDGET (Left Column) */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" /> Up Next
                </h2>
                <Link
                  to="/schedule"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View All
                </Link>
              </div>

              {!nextClass ? (
                <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
                  <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">
                    You're all done for today!
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    No more classes scheduled.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center">
                  {/* Time Remaining Indicator */}
                  <div className="mb-6 text-center">
                    {timeToNext > 0 ? (
                      <>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Starting in
                        </p>
                        <div
                          className={`text-4xl font-black ${timeToNext <= 15 ? "text-amber-500 animate-pulse" : "text-slate-900"}`}
                        >
                          {timeToNext} min
                        </div>
                        {timeToNext === 15 &&
                          nextClass._id === firstClass?._id && (
                            <p className="text-xs text-amber-600 font-bold mt-2 flex items-center justify-center gap-1">
                              <AlertCircle className="w-3 h-3" /> 15 Min Alarm
                              Playing!
                            </p>
                          )}
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                          <span className="text-sm font-bold text-emerald-700 uppercase tracking-wider">
                            Class is Live
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-500">
                          Ends at {nextClass.endTime}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Class Details Card */}
                  <div
                    className={`rounded-2xl p-5 border ${timeToNext <= 15 && timeToNext > 0 ? "bg-amber-50 border-amber-200" : timeToNext <= 0 ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-bold text-slate-900 text-lg leading-tight pr-2">
                        {nextClass.course?.name || "Class"}
                      </p>
                    </div>
                    <span className="inline-block text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg mb-4">
                      {nextClass.startTime} - {nextClass.endTime}
                    </span>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Room {nextClass.room || "TBA"} •{" "}
                        {nextClass.group?.name ||
                          nextClass.classroom?.name ||
                          ""}
                      </p>
                      {nextClass.teacher && (
                        <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {nextClass.teacher.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. MY GROUPS (Right Column) */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-slate-500" /> Cohorts &
                  Groups
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Access your class materials and communications.
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {isTeacher && (
                  <>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" /> Join
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Create
                    </button>
                  </>
                )}
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">
                  No groups assigned yet.
                </p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  {isTeacher
                    ? "Create a new group to start organizing your classes."
                    : "Ask your teacher or CR for the exact Group Name and PIN."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                {groups.map((group) => (
                  <div
                    key={group._id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="pr-4">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                          {group.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {group.description || "No description provided."}
                        </p>
                      </div>
                      <Link
                        to={`/manage-groups`}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 mt-auto">
                      {groupActions(group).map(
                        ({ icon: Icon, label, to, state, color }) => (
                          <Link
                            key={label}
                            to={to}
                            state={state}
                            className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-2.5 rounded-xl border transition-colors ${color}`}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 opacity-75" />
                            <span className="text-[9px] sm:text-[10px] font-bold tracking-wide uppercase opacity-90">
                              {label}
                            </span>
                          </Link>
                        ),
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />{" "}
                        {group.members?.length || 0} Members
                      </span>
                      {group.pin && group.createdBy === user?._id && (
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                          <Key className="w-3.5 h-3.5 text-slate-400" /> PIN:{" "}
                          {group.pin}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. BOTTOM QUICK NAVIGATION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-6">
          {[
            {
              label: "My Routine",
              desc: "View full schedule",
              to: "/schedule",
              icon: Calendar,
            },
            {
              label: "Attendance",
              desc: "Check matrix",
              to: "/manage-groups",
              icon: ClipboardList,
            },
            {
              label: "My Tasks",
              desc: "Manage to-do list",
              to: "/tasks",
              icon: CheckSquare,
            },
            {
              label: "Expenses",
              desc: "Track financials",
              to: "/expenses",
              icon: TrendingUp,
            },
          ].map(({ label, desc, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="bg-slate-50 p-3 rounded-xl text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{label}</h3>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* -------------------------------------- Modals --------------------------*/}
        {showJoinModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
              <h3 className="font-bold text-xl text-slate-900 mb-5">
                Join Group
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Group Name
                  </label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    placeholder="Enter exact group name"
                    value={joinForm.groupName}
                    onChange={(e) =>
                      setJoinForm((p) => ({ ...p, groupName: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Group PIN
                  </label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    placeholder="Enter PIN code"
                    value={joinForm.pin}
                    onChange={(e) =>
                      setJoinForm((p) => ({ ...p, pin: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                >
                  Request Join
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
              <h3 className="font-bold text-xl text-slate-900 mb-5">
                Create Group
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Group Name
                  </label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    placeholder="e.g. ICE 2nd Year Batch A"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Group PIN (4-10 chars)
                  </label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    placeholder="Set a secure PIN"
                    value={createForm.pin}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, pin: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="What is this group for?"
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
