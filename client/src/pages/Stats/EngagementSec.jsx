import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
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
  FileText,
  MessageSquare,
  Bell,
} from "lucide-react";
import { COLORS } from "./HelperFunc.js";

import SectionTitle from "./SectionTitle.jsx";
import ChartCard from "./ChartCard.jsx";

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
        {/* Activity Bar Chart */}
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
              <Tooltip />
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

        {/* 🎯 Interactive Materials by GROUP Pie Chart */}
        <ChartCard
          Icon={FileText}
          title="Materials by Group & Source"
          sub={`${materials.total} files shared across your groups`}
        >
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={materials.byCourse}
                dataKey="count"
                nameKey="course"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {materials.byCourse.map((entry, index) => {
                  const palette = [
                    COLORS.blue,
                    COLORS.indigo,
                    COLORS.violet,
                    COLORS.emerald,
                    COLORS.amber,
                    COLORS.orange,
                    COLORS.red,
                  ];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={palette[index % palette.length]}
                    />
                  );
                })}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} Shared Files`, name]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconSize={8} 
                wrapperStyle={{ fontSize: 11, paddingTop: "10px" }} 
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4 border-t border-gray-100 pt-3">
            {materials.byType.map((t) => (
              <span 
                key={t.type} 
                className="badge bg-gray-50 border border-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md font-medium"
              >
                {t.type}: {t.count}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>
    </section>
  );
}

export default EngagementSection;