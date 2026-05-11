import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";
import api from "../../utils/Api";

import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  CheckSquare,
  DollarSign,
  LogOut,
  User,
  Menu,
  GraduationCap,
  Building2,
  ClipboardCheck,
  Users,
  TrendingUp,
  Bell,
  MessageSquare,
  X,
  Settings,
} from "lucide-react";

// Base Navigation (Items everyone sees)
const baseNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/schedule", icon: Calendar, label: "My Schedule" },
  { to: "/manage-groups", icon: Users, label: "Manage Group" },
  { to: "/notes", icon: ClipboardList, label: "Notes" },
  { to: "/tasks", icon: CheckSquare, label: "My Tasks" },
  { to: "/expenses", icon: DollarSign, label: "Expenses" },
  { to: "/stats/overview", icon: TrendingUp, label: "Statistics" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/contributors", icon: Users, label: "Contributors" },
];

const useServerStatus = () => {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const check = async () => {
      if (isMounted) setStatus("connecting");
      try {
        await api.get("/health");
        if (isMounted) setStatus("connected");
      } catch {
        if (isMounted) setStatus("disconnected");
      }
    };

    check();
    intervalId = setInterval(check, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return status;
};

const statusConfig = {
  connecting: {
    color: "bg-amber-400",
    ring: "ring-amber-200",
    label: "Connecting",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  connected: {
    color: "bg-emerald-500",
    ring: "ring-emerald-200",
    label: "Connected",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  disconnected: {
    color: "bg-rose-500",
    ring: "ring-rose-200",
    label: "Offline",
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

const ServerIndicator = ({ status }) => {
  const cfg = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.border} transition-all`}
    >
      <span className="relative flex h-2 w-2">
        {status === "connecting" && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.color} opacity-75`}
          />
        )}
        {status === "connected" && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.color} opacity-40`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${cfg.color} ring-2 ${cfg.ring}`}
        />
      </span>
      <span
        className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wide ${cfg.text}`}
      >
        {cfg.label}
      </span>
    </div>
  );
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [recentLogs, setRecentLogs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const serverStatus = useServerStatus();

  const isTeacher = ["teacher", "admin"].includes(user?.role);
  const canManageRequests = ["class_rep", "teacher", "admin"].includes(
    user?.role,
  );

  let dynamicNavItems = [...baseNavItems];
  if (isTeacher) {
    dynamicNavItems.splice(3, 0, {
      to: "/dept-schedule",
      icon: Building2,
      label: "Dept. Routine",
    });
    dynamicNavItems.splice(4, 0, {
      to: "/attendance",
      icon: ClipboardCheck,
      label: "Group Attendance",
    });
  } else {
    dynamicNavItems.splice(3, 0, {
      to: "/attendance",
      icon: ClipboardCheck,
      label: "My Attendance",
    });
    dynamicNavItems.splice(4, 0, {
      to: "/chat",
      icon: MessageSquare,
      label: "Chat",
    });
  }

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchQuickLogs = async () => {
      try {
        const res = await api.get("/notifications/logs");
        setRecentLogs(res.data.logs.slice(0, 5));
        setUnreadCount(res.data.unreadCount);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    if (user) {
      fetchQuickLogs();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @keyframes profileSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .profile-btn .profile-ring {
          animation: profileSpin 4s linear infinite;
        }
        .profile-btn:hover .profile-ring {
          animation: profileSpin 0.8s linear infinite;
        }
        .hover-zoom-108 {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .profile-btn:hover .hover-zoom-108, 
        .notif-btn:hover .hover-zoom-108 {
          transform: scale(1.08);
        }
      `}</style>

      <div className="flex h-[100dvh] bg-slate-50 font-sans overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static inset-y-0 left-0 w-[280px] lg:w-72 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="h-16 lg:h-20 flex items-center justify-between px-5 lg:px-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-lg tracking-tight leading-none">
                  UniLife
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Manager
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Main Menu
            </p>

            {dynamicNavItems.map(({ to, icon: Icon, label }) => {
              const isActive =
                location.pathname === to ||
                (to !== "/" &&
                  location.pathname.startsWith(to) &&
                  to !== "/dashboard");
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"}`}
                  />
                  {label}
                </NavLink>
              );
            })}

            {canManageRequests && (
              <>
                <div className="pt-4 pb-2">
                  <div className="h-px w-full bg-slate-100"></div>
                </div>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Administration
                </p>
                <NavLink
                  to="/extra-requests"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <ClipboardCheck
                    className={`w-5 h-5 transition-colors ${location.pathname.includes("/extra-requests") ? "text-white" : "text-slate-400 group-hover:text-slate-700"}`}
                  />
                  Extra Requests
                </NavLink>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-slate-100 shrink-0">
            <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 border border-slate-200 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-indigo-700 text-sm">
                      {getInitials(user?.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl w-full text-sm font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-16 lg:h-20 flex items-center justify-between z-30 sticky top-0 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden pr-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
              >
                <Menu className="w-6 h-6" />
              </button>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize truncate">
                {location.pathname === "/" || location.pathname === "/dashboard"
                  ? "Dashboard"
                  : location.pathname.split("/")[1].replace("-", " ")}
              </h2>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 ml-auto shrink-0">
              <ServerIndicator status={serverStatus} />

              {/* INTERACTIVE NOTIFICATION BELL WITH TAILWIND HOVER */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="notif-btn group relative p-2 rounded-full focus:outline-none flex items-center justify-center w-10 h-10"
                >
                  {/* Background Circle: Expands and becomes slightly visible on hover */}
                  <div
                    className={`absolute inset-0 bg-slate-200 rounded-full transition-all duration-300 ease-out z-0 
                    ${notificationsOpen ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"}
                  `}
                  ></div>

                  {/* Bell Icon: Zooms and changes color on hover */}
                  <div className="relative z-10 flex items-center justify-center hover-zoom-108 text-slate-400 group-hover:text-slate-700 transition-colors duration-300">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                  </div>
                </button>

                {/* Notification Dropdown Menu */}
                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900">
                          Notifications
                        </h3>
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} New
                        </span>
                      </div>

                      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {recentLogs.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                              <Bell className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                              You have no new notifications.
                            </p>
                          </div>
                        ) : (
                          recentLogs.map((log) => (
                            <div
                              key={log._id}
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate(log.actionUrl);
                              }}
                              className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors ${log.isRead ? "opacity-70" : "bg-indigo-50/30"}`}
                            >
                              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                {log.type === "chat"
                                  ? "💬"
                                  : log.type === "notice"
                                    ? "📌"
                                    : "🔔"}
                                <span className="truncate">{log.title}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {log.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <button
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate("/notifications");
                          }}
                          className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                        >
                          View Full History
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* INTERACTIVE PROFILE AVATAR BUTTON WITH BOLDER RING */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="profile-btn relative focus:outline-none p-[4px] rounded-full flex items-center justify-center"
                >
                  {/* Outer Animated Gradient Ring - Thicker padding */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 profile-ring z-0"></div>

                  {/* White Mask: inset-[3px] leaves 3px of thick gradient showing */}
                  <div className="absolute inset-[3px] bg-white rounded-full z-0"></div>

                  {/* The Avatar: Remains exactly w-8 h-8, sits on top */}
                  <div className="relative z-10 hover-zoom-108 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center overflow-hidden w-8 h-8">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-indigo-700 text-sm">
                        {getInitials(user?.name)}
                      </span>
                    )}
                  </div>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider truncate">
                          {user?.role?.replace("_", " ")}
                        </p>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/notifications");
                          }}
                          className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <Bell className="w-4 h-4" />
                          Notifications
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate("/profile");
                          }}
                          className="flex items-center w-full gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          View Profile
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-transparent">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
