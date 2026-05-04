import {
  AreaChart,
  Area,
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

// import { Wallet, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { Wallet, TrendingUp, PieChart as PieIcon } from "lucide-react";
import { CAT_COLORS, COLORS } from "./HelperFunc.js";

import SectionTitle from "./SectionTitle.jsx";
import ChartCard from "./ChartCard.jsx";

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
              <Tooltip />
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

export default ExpensesSection;
