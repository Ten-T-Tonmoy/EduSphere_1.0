import { useEffect, useState } from "react";
import api from "../../utils/Api";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  CalendarCheck2,
  Wallet,
  CheckSquare,
  BookOpen,
  Flame,
  FileText,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  MessageSquare,
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  CAT_COLORS,
  isoMonth,
  makeMonthBuckets,
  makeWeekBuckets,
  monthLabel,
  processAll,
  processAttendance,
  processEngagement,
  processExpenses,
  processKpis,
  processMaterials,
  processTasks,
  toMonday,
  COLORS,
} from "./HelperFunc.js";

import SectionTitle from "./SectionTitle.jsx";
import ChartCard from "./ChartCard.jsx";
import AttendanceSection from "./AttendenceSec.jsx";
import ExpensesSection from "./ExpenseSec.jsx";
import EngagementSection from "./EngagementSec.jsx";
import TasksSection from "./TaskSec.jsx";

import { useAuth } from "../../context/Authcontext.jsx";
import KpiCard from "./KPI.jsx";
//-------------------configs-----------------------
const API_BASE = "http://localhost:5000/api/stats";

//control---------------
const USE_DUMMY = false;

//-------------------------main f--------------------------
export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const USER_ID = user._id;
  // console.log("User id is " + USER_ID);
  async function load() {
    setLoading(true);
    setError(null);
    try {
      let raw;
      if (USE_DUMMY) {
        const { default: DUMMY } = await import("./statsDummy.js");
        raw = DUMMY.data;
      } else {
        const res = await api.get(`/stats/${USER_ID}`); 
      raw = res.data.data;
      }
      //----------process----------
      setStats(processAll(raw));
    } catch (e) {
    setError(e.response?.data?.message || e.message || "Network error");
  } finally {
    setLoading(false);
  }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading your stats…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card text-center max-w-sm">
          <AlertCircle
            size={40}
            className="text-red-400 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="font-semibold text-gray-700">{error}</p>
          <button
            className="btn-primary mt-4 inline-flex items-center gap-2 mx-auto"
            onClick={load}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    attendance,
    courseAttendance,
    overallAttendance,
    expenses,
    expenseCategories,
    tasks,
    materials,
    engagement,
    kpis,
  } = stats;
  console.log("Processed stats:", stats);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Stats</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            An overall statistics of your semester activity
          </p>
        </div>
        <span className="badge bg-blue-50 text-blue-700 text-xs self-start sm:self-center">
          April 2026
        </span>
      </div>

      {/* ------------------------k prfm indc--------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
        <KpiCard
          Icon={CalendarCheck2}
          label="Attendance"
          value={`${kpis.overallAttendance}%`}
          sub="overall"
          accent="green"
        />
        <KpiCard
          Icon={Wallet}
          label="Spent this month"
          value={`৳${kpis.totalSpentThisMonth.toLocaleString()}`}
          sub="all categories"
          accent="orange"
        />
        <KpiCard
          Icon={CheckSquare}
          label="Task completion"
          value={`${kpis.taskCompletionRate}%`}
          sub="this semester"
          accent="blue"
        />
        <KpiCard
          Icon={BookOpen}
          label="Active courses"
          value={kpis.activeCourses}
          sub="this semester"
          accent="violet"
        />
        <KpiCard
          Icon={Flame}
          label="Activity streak"
          value={`${kpis.streakDays}d`}
          sub="consecutive days"
          accent="amber"
        />
        <KpiCard
          Icon={FileText}
          label="Materials"
          value={kpis.materialsThisWeek}
          sub="added this week"
          accent="blue"
        />
      </div>

      <AttendanceSection
        coursesData={attendance}
        byCourse={courseAttendance}
        overall={overallAttendance}
      />
      <ExpensesSection monthly={expenses} categories={expenseCategories} />
      <TasksSection tasks={tasks} />
      <EngagementSection engagement={engagement} materials={materials} />
    </div>
  );
}
