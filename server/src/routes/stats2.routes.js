// const express = require("express");
// const router = express.Router();

// // ─── DUMMY DATA ────────────────────────────────────────────────────────────────
// // In production, replace each section with real DB queries (Mongoose / Prisma etc.)

// const DUMMY = {
//   user: {
//     id: "u_001",
//     name: "Arif Hossain",
//     email: "arif@uni.ac.bd",
//     role: "student",
//     department: "ICE",
//   },

//   // attendance rows — last 12 weeks
//   attendance: [
//     // week label, present, absent, late
//     { week: "W1", present: 5, absent: 1, late: 0 },
//     { week: "W2", present: 4, absent: 1, late: 1 },
//     { week: "W3", present: 6, absent: 0, late: 0 },
//     { week: "W4", present: 5, absent: 0, late: 1 },
//     { week: "W5", present: 4, absent: 2, late: 0 },
//     { week: "W6", present: 6, absent: 0, late: 0 },
//     { week: "W7", present: 3, absent: 2, late: 1 },
//     { week: "W8", present: 5, absent: 1, late: 0 },
//     { week: "W9", present: 6, absent: 0, late: 0 },
//     { week: "W10", present: 4, absent: 1, late: 1 },
//     { week: "W11", present: 5, absent: 0, late: 1 },
//     { week: "W12", present: 6, absent: 0, late: 0 },
//   ],

//   // per-course attendance %
//   courseAttendance: [
//     { course: "ICE-401", name: "OS", pct: 88 },
//     { course: "ICE-403", name: "Compiler", pct: 72 },
//     { course: "ICE-405", name: "Networks", pct: 95 },
//     { course: "ICE-407", name: "AI", pct: 80 },
//     { course: "ICE-409", name: "Software Eng", pct: 65 },
//   ],

//   // expenses — last 6 months
//   expenses: [
//     { month: "Nov", food: 3200, transport: 800, books: 500, other: 400 },
//     { month: "Dec", food: 2800, transport: 600, books: 1200, other: 700 },
//     { month: "Jan", food: 3500, transport: 900, books: 300, other: 600 },
//     { month: "Feb", food: 3100, transport: 750, books: 800, other: 300 },
//     { month: "Mar", food: 3400, transport: 850, books: 0, other: 900 },
//     { month: "Apr", food: 2900, transport: 700, books: 600, other: 500 },
//   ],

//   // expense category breakdown (pie)
//   expenseCategories: [
//     { category: "Food", amount: 18900, color: "#f97316" },
//     { category: "Transport", amount: 4600, color: "#3b82f6" },
//     { category: "Books", amount: 3400, color: "#8b5cf6" },
//     { category: "Other", amount: 3400, color: "#6b7280" },
//   ],

//   // tasks summary
//   tasks: {
//     total: 34,
//     completed: 21,
//     pending: 9,
//     overdue: 4,
//     // by course
//     byCourse: [
//       { course: "OS", completed: 6, pending: 2, overdue: 1 },
//       { course: "Compiler", completed: 4, pending: 3, overdue: 2 },
//       { course: "Networks", completed: 5, pending: 1, overdue: 0 },
//       { course: "AI", completed: 3, pending: 2, overdue: 1 },
//       { course: "Software Eng", completed: 3, pending: 1, overdue: 0 },
//     ],
//     // completion trend last 8 weeks
//     weeklyCompletion: [
//       { week: "W5", completed: 2, added: 4 },
//       { week: "W6", completed: 3, added: 3 },
//       { week: "W7", completed: 1, added: 5 },
//       { week: "W8", completed: 4, added: 2 },
//       { week: "W9", completed: 3, added: 3 },
//       { week: "W10", completed: 2, added: 4 },
//       { week: "W11", completed: 4, added: 2 },
//       { week: "W12", completed: 2, added: 1 },
//     ],
//   },

//   // materials uploaded / accessed
//   materials: {
//     total: 47,
//     byType: [
//       { type: "PDF", count: 28 },
//       { type: "Slides", count: 12 },
//       { type: "Code", count: 5 },
//       { type: "Other", count: 2 },
//     ],
//     // uploads per course
//     byCourse: [
//       { course: "OS", count: 12 },
//       { course: "Compiler", count: 8 },
//       { course: "Networks", count: 10 },
//       { course: "AI", count: 9 },
//       { course: "Software Eng", count: 8 },
//     ],
//   },

//   // engagement (messages + notices read)
//   engagement: [
//     { month: "Nov", messages: 24, notices: 8 },
//     { month: "Dec", messages: 18, notices: 6 },
//     { month: "Jan", messages: 32, notices: 10 },
//     { month: "Feb", messages: 28, notices: 9 },
//     { month: "Mar", messages: 35, notices: 12 },
//     { month: "Apr", messages: 22, notices: 7 },
//   ],

//   // summary KPIs
//   kpis: {
//     overallAttendance: 83,
//     totalSpentThisMonth: 4700,
//     taskCompletionRate: 72,
//     activeCourses: 5,
//     streakDays: 12,
//     materialsThisWeek: 4,
//   },
// };

// //---------------------------routes---------------------------------
// /**
//  * GET /api/stats/:userId
//  * Returns the full stats payload for the dashboard.
//  */
// router.get("/:userId", async (req, res) => {
//   try {
//     // const { userId } = req.params;
//     // TODO: const data = await buildStatsForUser(userId);

//     res.json({
//       success: true,
//       data: DUMMY,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// /**
//  * GET /api/stats/:userId/attendance
//  * Granular attendance data only.
//  */
// router.get("/:userId/attendance", async (req, res) => {
//   res.json({
//     success: true,
//     data: {
//       weekly: DUMMY.attendance,
//       byCourse: DUMMY.courseAttendance,
//       overall: DUMMY.kpis.overallAttendance,
//     },
//   });
// });

// /**
//  * GET /api/stats/:userId/expenses
//  * Expense breakdown only.
//  */
// router.get("/:userId/expenses", async (req, res) => {
//   res.json({
//     success: true,
//     data: {
//       monthly: DUMMY.expenses,
//       categories: DUMMY.expenseCategories,
//       thisMonth: DUMMY.kpis.totalSpentThisMonth,
//     },
//   });
// });

// /**
//  * GET /api/stats/:userId/tasks
//  * Task stats only.
//  */
// router.get("/:userId/tasks", async (req, res) => {
//   res.json({ success: true, data: DUMMY.tasks });
// });

// module.exports = router;
