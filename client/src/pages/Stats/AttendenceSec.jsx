import ChartCard from "./ChartCard";
import SectionTitle from "./SectionTitle";
import { COLORS } from "./HelperFunc";

import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CalendarCheck2, TrendingUp, BarChart2 } from "lucide-react";

function AttendanceSection({ coursesData, byCourse, overall }) {
  return (
    <section>
      <SectionTitle
        Icon={CalendarCheck2}
        sub="Across all courses this semester"
      >
        Attendance
      </SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* NEW COURSES BREAKDOWN CHART */}
        <ChartCard
          Icon={BarChart2}
          title="Courses Breakdown"
          sub="Present / Absent per course"
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={coursesData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="present"
                name="Present"
                stackId="a"
                fill={COLORS.emerald}
              />
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

        {/* PER-COURSE PROGRESS BARS (UNCHANGED) */}
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
                <div key={c.course || c.name}>
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

export default AttendanceSection;