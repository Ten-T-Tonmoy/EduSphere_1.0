import React, { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ZAxis,
} from "recharts";

const DUMMY = {
  user: {
    id: "u_001",
    name: "Arif Hossain",
    email: "arif@uni.ac.bd",
    role: "student",
    department: "ICE",
  },

  // attendance rows — last 12 weeks
  attendance: [
    // week label, present, absent, late
    { week: "W1", present: 5, absent: 1, late: 0 },
    { week: "W2", present: 4, absent: 1, late: 1 },
    { week: "W3", present: 6, absent: 0, late: 0 },
    { week: "W4", present: 5, absent: 0, late: 1 },
    { week: "W5", present: 4, absent: 2, late: 0 },
    { week: "W6", present: 6, absent: 0, late: 0 },
    { week: "W7", present: 3, absent: 2, late: 1 },
    { week: "W8", present: 5, absent: 1, late: 0 },
    { week: "W9", present: 6, absent: 0, late: 0 },
    { week: "W10", present: 4, absent: 1, late: 1 },
    { week: "W11", present: 5, absent: 0, late: 1 },
    { week: "W12", present: 6, absent: 0, late: 0 },
  ],

  // per-course attendance %
  courseAttendance: [
    { course: "ICE-401", name: "OS", pct: 88 },
    { course: "ICE-403", name: "Compiler", pct: 72 },
    { course: "ICE-405", name: "Networks", pct: 95 },
    { course: "ICE-407", name: "AI", pct: 80 },
    { course: "ICE-409", name: "Software Eng", pct: 65 },
  ],

  // expenses — last 6 months
  expenses: [
    { month: "Nov", food: 3200, transport: 800, books: 500, other: 400 },
    { month: "Dec", food: 2800, transport: 600, books: 1200, other: 700 },
    { month: "Jan", food: 3500, transport: 900, books: 300, other: 600 },
    { month: "Feb", food: 3100, transport: 750, books: 800, other: 300 },
    { month: "Mar", food: 3400, transport: 850, books: 0, other: 900 },
    { month: "Apr", food: 2900, transport: 700, books: 600, other: 500 },
  ],

  // expense category breakdown (pie)
  expenseCategories: [
    { category: "Food", amount: 18900, color: "#f97316" },
    { category: "Transport", amount: 4600, color: "#3b82f6" },
    { category: "Books", amount: 3400, color: "#8b5cf6" },
    { category: "Other", amount: 3400, color: "#6b7280" },
  ],

  // tasks summary
  tasks: {
    total: 34,
    completed: 21,
    pending: 9,
    overdue: 4,
    // by course
    byCourse: [
      { course: "OS", completed: 6, pending: 2, overdue: 1 },
      { course: "Compiler", completed: 4, pending: 3, overdue: 2 },
      { course: "Networks", completed: 5, pending: 1, overdue: 0 },
      { course: "AI", completed: 3, pending: 2, overdue: 1 },
      { course: "Software Eng", completed: 3, pending: 1, overdue: 0 },
    ],
    // completion trend last 8 weeks
    weeklyCompletion: [
      { week: "W5", completed: 2, added: 4 },
      { week: "W6", completed: 3, added: 3 },
      { week: "W7", completed: 1, added: 5 },
      { week: "W8", completed: 4, added: 2 },
      { week: "W9", completed: 3, added: 3 },
      { week: "W10", completed: 2, added: 4 },
      { week: "W11", completed: 4, added: 2 },
      { week: "W12", completed: 2, added: 1 },
    ],
  },

  // materials uploaded / accessed
  materials: {
    total: 47,
    byType: [
      { type: "PDF", count: 28 },
      { type: "Slides", count: 12 },
      { type: "Code", count: 5 },
      { type: "Other", count: 2 },
    ],
    // uploads per course
    byCourse: [
      { course: "OS", count: 12 },
      { course: "Compiler", count: 8 },
      { course: "Networks", count: 10 },
      { course: "AI", count: 9 },
      { course: "Software Eng", count: 8 },
    ],
  },

  // engagement (messages + notices read)
  engagement: [
    { month: "Nov", messages: 24, notices: 8 },
    { month: "Dec", messages: 18, notices: 6 },
    { month: "Jan", messages: 32, notices: 10 },
    { month: "Feb", messages: 28, notices: 9 },
    { month: "Mar", messages: 35, notices: 12 },
    { month: "Apr", messages: 22, notices: 7 },
  ],

  // summary KPIs
  kpis: {
    overallAttendance: 83,
    totalSpentThisMonth: 4700,
    taskCompletionRate: 72,
    activeCourses: 5,
    streakDays: 12,
    materialsThisWeek: 4,
  },
};

const scatterData = [
  { expense: 50, savings: 120, day: "Mon" },
  { expense: 80, savings: 90, day: "Tue" },
  { expense: 35, savings: 150, day: "Wed" },
  { expense: 120, savings: 60, day: "Thu" },
  { expense: 45, savings: 130, day: "Fri" },
  { expense: 200, savings: 30, day: "Sat" },
  { expense: 150, savings: 40, day: "Sun" },
];

const radarData = [
  { category: "Food", value: 85, fullMark: 100 },
  { category: "Transport", value: 60, fullMark: 100 },
  { category: "Health", value: 45, fullMark: 100 },
  { category: "Education", value: 75, fullMark: 100 },
  { category: "Entertainment", value: 50, fullMark: 100 },
  { category: "Savings", value: 40, fullMark: 100 },
];

const PieData = DUMMY.expenses.map(({ month, ...exp }) => ({
  month: month,
  exp: exp,
}));
const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#6b7280"];

const TestPage = () => {
  return (
    <div className=" w-full flex  flex-col gap-2 p-4">
      {/* --------------------linechart-------------- */}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={DUMMY.engagement}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="messages"
            stroke="#10b981"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="notices"
            stroke="#ef4444"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* -------------------areacharts------------------- */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={DUMMY.expenses}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Area
            type="monotone"
            dataKey="food"
            stackId="1"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="books"
            stackId="1"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={DUMMY.attendance}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="present" stackId="a" fill="#10b981"></Bar>
          <Bar dataKey="absent" stackId="a" fill="#ef4444" />
          <Bar dataKey="late" stackId="a" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
      {/* <ResponsiveContainer width="100%" height={300}></ResponsiveContainer> */}
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="expense" name="Expense" unit="$" />
          <YAxis dataKey="savings" name="Savings" unit="$" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend />
          <Scatter name="Daily Spending" data={scatterData} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="Budget Usage"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
      <ExpensePieChart />
    </div>
  );
};

export default TestPage;

function ExpensePieChart() {
  const [selectedMonth, setSelectedMonth] = useState("Dec");
  const currentMonthData = PieData.find(
    (data) => data.month === selectedMonth,
  ).exp;
  const refinedData = Object.entries(currentMonthData).map(([key, val]) => ({
    name: key,
    value: val,
  }));

  console.log(refinedData);
  return (
    <div className="bg-yellow-200/30 rounded-md">
      <ResponsiveContainer height={300} width="100%">
        <PieChart>
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />
          <Pie
            data={refinedData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label="name"
            fill="#f59e0b"
          >
            {refinedData.map((val, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
