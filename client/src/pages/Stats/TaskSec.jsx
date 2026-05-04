import {
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
  CheckSquare,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {  COLORS } from "./HelperFunc.js";

import SectionTitle from "./SectionTitle.jsx";
import ChartCard from "./ChartCard.jsx";

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
              <Tooltip />
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
              <Tooltip />
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

export default TasksSection;
