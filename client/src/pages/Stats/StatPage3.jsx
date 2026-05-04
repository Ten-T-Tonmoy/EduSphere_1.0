import { useEffect, useState } from "react";
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

import { useAuth } from "../../context/Authcontext";
// const API_BASE = "/api/stats";
const API_BASE = "http://localhost:5000/api/stats";

const COLORS = {
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  green: "#22c55e",
  emerald: "#10b981",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  gray: "#6b7280",
};

//--------------components------------------

function KpiCard({ Icon, label, value, sub, accent = "blue" }) {
  const iconBg = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };
  const ring = {
    blue: "ring-blue-100",
    green: "ring-emerald-100",
    violet: "ring-violet-100",
    amber: "ring-amber-100",
    orange: "ring-orange-100",
    red: "ring-red-100",
  };
  return (
    <div
      className={`card flex items-start gap-4 ring-1 ${ring[accent] || "ring-gray-100"}`}
    >
      <div
        className={`${iconBg[accent] || "bg-gray-100 text-gray-600"} p-3 rounded-xl shrink-0`}
      >
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ Icon, children, sub }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && (
        <Icon size={18} className="text-gray-500 shrink-0" strokeWidth={1.8} />
      )}
      <div>
        <h2 className="text-base font-semibold text-gray-800 leading-none">
          {children}
        </h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, Icon, sub, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      <SectionTitle Icon={Icon} sub={sub}>
        {title}
      </SectionTitle>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="leading-5">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

function AttendanceSection({ weekly, byCourse, overall }) {
  return (
    <section>
      <SectionTitle
        Icon={CalendarCheck2}
        sub="Across all courses this semester"
      >
        Attendance
      </SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          Icon={BarChart2}
          title="Weekly Breakdown"
          sub="Present / Absent / Late per week"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={weekly}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="present"
                name="Present"
                stackId="a"
                fill={COLORS.emerald}
              />
              <Bar dataKey="late" name="Late" stackId="a" fill={COLORS.amber} />
              <Bar
                dataKey="absent"
                name="Absent"
                stackId="a"
                fill={COLORS.red}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          Icon={TrendingUp}
          title="Per-Course Rate"
          sub="% attendance by subject"
        >
          <div className="space-y-3 mt-1">
            {byCourse.map((c) => {
              const color =
                c.pct >= 90
                  ? COLORS.emerald
                  : c.pct >= 75
                    ? COLORS.blue
                    : c.pct >= 65
                      ? COLORS.amber
                      : COLORS.red;
              return (
                <div key={c.course}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{c.name}</span>
                    <span className="font-bold" style={{ color }}>
                      {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-right">
            Overall:{" "}
            <span className="font-semibold text-gray-700">{overall}%</span>
          </p>
        </ChartCard>
      </div>
    </section>
  );
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
function ExpensesSection({ monthly, categories }) {
  const total = categories.reduce((s, c) => s + c.amount, 0);
  return (
    <section>
      <SectionTitle Icon={Wallet} sub="Track where your money goes">
        Expenses
      </SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          Icon={TrendingUp}
          title="Monthly Spending"
          sub="Last 6 months by category"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={monthly}
              margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
            >
              <defs>
                {[
                  ["food", COLORS.orange],
                  ["transport", COLORS.blue],
                  ["books", COLORS.violet],
                  ["other", COLORS.gray],
                ].map(([k, c]) => (
                  <linearGradient
                    key={k}
                    id={`grad-${k}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="food"
                name="Food"
                stroke={COLORS.orange}
                fill="url(#grad-food)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="transport"
                name="Transport"
                stroke={COLORS.blue}
                fill="url(#grad-transport)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="books"
                name="Books"
                stroke={COLORS.violet}
                fill="url(#grad-books)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="other"
                name="Other"
                stroke={COLORS.gray}
                fill="url(#grad-other)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          Icon={PieIcon}
          title="Category Breakdown"
          sub={`Total: ৳${total.toLocaleString()}`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  dataKey="amount"
                  paddingAngle={3}
                >
                  {categories.map((c) => (
                    <Cell key={c.category} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `৳${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 min-w-[120px]">
              {categories.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: c.color }}
                    />
                    <span className="text-gray-600">{c.category}</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {Math.round((c.amount / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function TasksSection({ tasks }) {
  const { total, completed, pending, overdue, byCourse, weeklyCompletion } =
    tasks;
  const pct = Math.round((completed / (total || 1)) * 100);
  return (
    <section>
      <SectionTitle Icon={CheckSquare} sub="Track your academic to-do list">
        Tasks
      </SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          Icon={TrendingUp}
          title="Weekly Completion Trend"
          sub="Tasks added vs completed"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={weeklyCompletion}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="added"
                name="Added"
                stroke={COLORS.indigo}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke={COLORS.emerald}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          Icon={BarChart2}
          title="Tasks by Course"
          sub="Completed / Pending / Overdue"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={byCourse}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="course" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="completed"
                name="Completed"
                fill={COLORS.emerald}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="pending"
                name="Pending"
                fill={COLORS.amber}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="overdue"
                name="Overdue"
                fill={COLORS.red}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 flex flex-col sm:flex-row items-center gap-6">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={[{ v: completed }, { v: total - completed }]}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={54}
              startAngle={90}
              endAngle={-270}
              dataKey="v"
            >
              <Cell fill={COLORS.emerald} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 grid grid-cols-3 gap-4 text-center">
          {[
            {
              Icon: CheckCircle2,
              label: "Completed",
              val: completed,
              color: "text-emerald-600",
            },
            {
              Icon: Clock,
              label: "Pending",
              val: pending,
              color: "text-amber-600",
            },
            {
              Icon: AlertCircle,
              label: "Overdue",
              val: overdue,
              color: "text-red-500",
            },
          ].map((s) => (
            <div key={s.label}>
              <s.Icon
                size={18}
                className={`mx-auto mb-1 ${s.color}`}
                strokeWidth={1.8}
              />
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="text-center sm:text-right">
          <p className="text-4xl font-extrabold text-gray-800">{pct}%</p>
          <p className="text-xs text-gray-400 mt-1">completion rate</p>
        </div>
      </div>
    </section>
  );
}

// ─── ENGAGEMENT & MATERIALS ───────────────────────────────────────────────────
function EngagementSection({ engagement, materials }) {
  return (
    <section>
      <SectionTitle
        Icon={MessageSquare}
        sub="Messages sent and materials accessed"
      >
        Engagement & Materials
      </SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          Icon={Bell}
          title="Classroom Activity"
          sub="Messages & notices per month"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={engagement}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="messages"
                name="Messages"
                fill={COLORS.blue}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="notices"
                name="Notices"
                fill={COLORS.violet}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          Icon={FileText}
          title="Materials by Course"
          sub={`${materials.total} files total`}
        >
          <div className="space-y-3 mt-1">
            {materials.byCourse.map((c, i) => {
              const palette = [
                COLORS.blue,
                COLORS.indigo,
                COLORS.violet,
                COLORS.emerald,
                COLORS.amber,
              ];
              const color = palette[i % palette.length];
              const max = Math.max(...materials.byCourse.map((x) => x.count));
              return (
                <div key={c.course}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">
                      {c.course}
                    </span>
                    <span className="font-bold" style={{ color }}>
                      {c.count} files
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(c.count / max) * 100}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {materials.byType.map((t) => (
              <span key={t.type} className="badge bg-gray-100 text-gray-600">
                {t.type}: {t.count}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>
    </section>
  );
}

//----------------------------------main part-----------------------------------

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const USER_ID = user._id;

  function load() {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/${USER_ID}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError("Failed to load stats.");
      })
      .catch(() => setError("Network error — is the server running?"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

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
            className="btn-primary mt-4 inline-flex items-center gap-2"
            onClick={load}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    kpis,
    attendance,
    courseAttendance,
    expenses,
    expenseCategories,
    tasks,
    materials,
    engagement,
  } = data;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-10">
      {/* ------------------------header---------------- */}
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

      {/* ----------------------------Top Boxes------------------- */}
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
        weekly={attendance}
        byCourse={courseAttendance}
        overall={kpis.overallAttendance}
      />
      <ExpensesSection monthly={expenses} categories={expenseCategories} />
      <TasksSection tasks={tasks} />
      <EngagementSection engagement={engagement} materials={materials} />
    </div>
  );
}
