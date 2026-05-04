// // userId param === req.user.id .... students see their own stats.

// const express = require("express");
// const router = express.Router();
// const {
//   subWeeks,
//   subMonths,
//   format,
//   startOfMonth,
//   endOfMonth,
//   startOfWeek,
// } = require("date-fns");

// //------models---------
// const Attendance = require("../models/Attendence");
// const Expense = require("../models/Expense");
// const Task = require("../models/Task");
// const Material = require("../models/Material");
// const Message = require("../models/Message");
// const Notice = require("../models/Notice");
// const Course = require("../models/Course");
// const Classroom = require("../models/Classroom");
// const { auth } = require("../middleware/Auth");

// // only stu visiblity
// function guardSelf(req, res, next) {
//   return auth(req, res, () => {
//     if (
//       req.user._id.toString() !== req.params.userId &&
//       req.user.role !== "admin"
//     ) {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }
//     next();
//   });
// }

// //----------------------

// function monStart(date) {
//   return startOfWeek(date, { weekStartsOn: 1 });
// }

// //------------------------------
// function weekBuckets(n) {
//   const now = new Date();
//   return Array.from({ length: n }, (_, i) => {
//     const start = monStart(subWeeks(now, n - 1 - i));
//     return { start, label: `W${i + 1}` };
//   });
// }

// //---------------------------------
// function monthBuckets(n) {
//   const now = new Date();
//   return Array.from({ length: n }, (_, i) => {
//     const d = subMonths(now, n - 1 - i);
//     return {
//       start: startOfMonth(d),
//       end: endOfMonth(d),
//       label: format(d, "MMM"),
//     };
//   });
// }

// // GET /api/stats/:userId   — full dashboard payload

// router.get("/:userId", async (req, res) => {
//   try {
//     const uid = req.params.userId;
//     const [att, exp, tasks, mats, eng, kpis] = await Promise.all([
//       buildAttendance(uid),
//       buildExpenses(uid),
//       buildTasks(uid),
//       buildMaterials(uid),
//       buildEngagement(uid),
//       buildKpis(uid),
//     ]);
//     res.json({
//       success: true,
//       data: {
//         attendance: att.weekly,
//         courseAttendance: att.byCourse,
//         expenses: exp.monthly,
//         expenseCategories: exp.categories,
//         tasks,
//         materials: mats,
//         engagement: eng,
//         kpis,
//       },
//     });
//   } catch (err) {
//     console.error("[stats/full]", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// router.get("/:userId/attendance", guardSelf, async (req, res) => {
//   try {
//     res.json({ success: true, data: await buildAttendance(req.params.userId) });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// router.get("/:userId/expenses", guardSelf, async (req, res) => {
//   try {
//     res.json({ success: true, data: await buildExpenses(req.params.userId) });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// router.get("/:userId/tasks", guardSelf, async (req, res) => {
//   try {
//     res.json({ success: true, data: await buildTasks(req.params.userId) });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// //helper funcs---------------------------------------->>>>>>>>>>>>>>>>>>>

// //-------------------------------------------attendence--------------
// async function buildAttendance(userId) {
//   const NUM_WEEKS = 12;
//   const wBuckets = weekBuckets(NUM_WEEKS);
//   const since = wBuckets[0].start;

//   // Fetch all student attendance records, populated with course info
//   const [recentRows, allRows] = await Promise.all([
//     Attendance.find({ studentId: userId, date: { $gte: since } })
//       .populate("courseId", "name code")
//       .lean(),
//     Attendance.find({ studentId: userId })
//       .populate("courseId", "name code")
//       .lean(),
//   ]);

//   // Weekly buckets
//   const weekMap = Object.fromEntries(
//     wBuckets.map((b) => [
//       b.label,
//       { week: b.label, present: 0, absent: 0, late: 0 },
//     ]),
//   );
//   recentRows.forEach((r) => {
//     const rMs = monStart(new Date(r.date)).getTime();
//     const buck = wBuckets.find((b) => b.start.getTime() === rMs);
//     if (!buck) return;
//     const s = (r.status || "present").toLowerCase();
//     if (s === "present") weekMap[buck.label].present++;
//     else if (s === "absent") weekMap[buck.label].absent++;
//     else if (s === "late") weekMap[buck.label].late++;
//   });
//   const weekly = wBuckets.map((b) => weekMap[b.label]);

//   // Per-course %
//   const cMap = {};
//   allRows.forEach((r) => {
//     if (!r.courseId) return;
//     const k = r.courseId._id.toString();
//     if (!cMap[k])
//       cMap[k] = {
//         course: r.courseId.code,
//         name: r.courseId.name,
//         total: 0,
//         present: 0,
//       };
//     cMap[k].total++;
//     if ((r.status || "").toLowerCase() !== "absent") cMap[k].present++;
//   });
//   const byCourse = Object.values(cMap).map((c) => ({
//     course: c.course,
//     name: c.name,
//     pct: c.total ? Math.round((c.present / c.total) * 100) : 0,
//   }));

//   const overallPresent = allRows.filter(
//     (r) => (r.status || "").toLowerCase() !== "absent",
//   ).length;
//   const overall = allRows.length
//     ? Math.round((overallPresent / allRows.length) * 100)
//     : 0;

//   return { weekly, byCourse, overall };
// }

// //------------------------------------expenses---------------------------------------
// const CAT_MAP = {
//   food: "food",
//   meal: "food",
//   dining: "food",
//   lunch: "food",
//   breakfast: "food",
//   dinner: "food",
//   snack: "food",
//   transport: "transport",
//   travel: "transport",
//   commute: "transport",
//   bus: "transport",
//   rickshaw: "transport",
//   ride: "transport",
//   books: "books",
//   book: "books",
//   stationery: "books",
//   supplies: "books",
//   printing: "books",
//   photocopy: "books",
// };
// const CAT_COLORS = {
//   food: "#f97316",
//   transport: "#3b82f6",
//   books: "#8b5cf6",
//   other: "#6b7280",
// };

// async function buildExpenses(userId) {
//   const mBuckets = monthBuckets(6);
//   const since = mBuckets[0].start;
//   const rows = await Expense.find({ userId, date: { $gte: since } }).lean();

//   // Monthly stacked
//   const mMap = Object.fromEntries(
//     mBuckets.map((b) => [
//       b.label,
//       { month: b.label, food: 0, transport: 0, books: 0, other: 0 },
//     ]),
//   );
//   rows.forEach((r) => {
//     const lbl = format(new Date(r.date), "MMM");
//     if (!mMap[lbl]) return;
//     const cat = CAT_MAP[(r.category || "").toLowerCase()] || "other";
//     mMap[lbl][cat] += r.amount || 0;
//   });
//   // Round values
//   const monthly = mBuckets.map((b) => {
//     const m = mMap[b.label];
//     return {
//       month: m.month,
//       food: Math.round(m.food),
//       transport: Math.round(m.transport),
//       books: Math.round(m.books),
//       other: Math.round(m.other),
//     };
//   });

//   // Category totals for pie
//   const totals = { food: 0, transport: 0, books: 0, other: 0 };
//   rows.forEach((r) => {
//     const cat = CAT_MAP[(r.category || "").toLowerCase()] || "other";
//     totals[cat] += r.amount || 0;
//   });
//   const categories = Object.entries(totals).map(([k, v]) => ({
//     category: k.charAt(0).toUpperCase() + k.slice(1),
//     amount: Math.round(v),
//     color: CAT_COLORS[k],
//   }));

//   // This-month total
//   const thisMonth = Math.round(
//     rows
//       .filter((r) => new Date(r.date) >= startOfMonth(new Date()))
//       .reduce((s, r) => s + (r.amount || 0), 0),
//   );

//   return { monthly, categories, thisMonth };
// }

// // ── 3. TASKS ─────────────────────────────────────────────────────────────────
// async function buildTasks(userId) {
//   const NUM_WEEKS = 8;
//   const wBuckets = weekBuckets(NUM_WEEKS);
//   const since = wBuckets[0].start;
//   const now = new Date();

//   const all = await Task.find({ userId })
//     .populate("relatedCourseId", "name code")
//     .lean();

//   const completed = all.filter((t) => t.completed).length;
//   const overdue = all.filter(
//     (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now,
//   ).length;
//   const pending = all.filter(
//     (t) => !t.completed && (!t.dueDate || new Date(t.dueDate) >= now),
//   ).length;

//   // By course
//   const cMap = {};
//   all.forEach((t) => {
//     const k = t.relatedCourseId?._id?.toString() || "__none";
//     const n = t.relatedCourseId?.name || "General";
//     if (!cMap[k]) cMap[k] = { course: n, completed: 0, pending: 0, overdue: 0 };
//     if (t.completed) cMap[k].completed++;
//     else if (t.dueDate && new Date(t.dueDate) < now) cMap[k].overdue++;
//     else cMap[k].pending++;
//   });
//   const byCourse = Object.values(cMap);

//   // Weekly trend
//   const wMap = Object.fromEntries(
//     wBuckets.map((b) => [b.label, { week: b.label, completed: 0, added: 0 }]),
//   );
//   all
//     .filter((t) => new Date(t.createdAt) >= since)
//     .forEach((t) => {
//       const rMs = monStart(new Date(t.createdAt)).getTime();
//       const buck = wBuckets.find((b) => b.start.getTime() === rMs);
//       if (buck) wMap[buck.label].added++;
//     });
//   // Use updatedAt as completion-date proxy (or swap for a dedicated completedAt field)
//   all
//     .filter((t) => t.completed && t.updatedAt && new Date(t.updatedAt) >= since)
//     .forEach((t) => {
//       const rMs = monStart(new Date(t.updatedAt)).getTime();
//       const buck = wBuckets.find((b) => b.start.getTime() === rMs);
//       if (buck) wMap[buck.label].completed++;
//       l;
//     });
//   const weeklyCompletion = wBuckets.map((b) => wMap[b.label]);

//   return {
//     total: all.length,
//     completed,
//     pending,
//     overdue,
//     byCourse,
//     weeklyCompletion,
//   };
// }

// // ── 4. MATERIALS ─────────────────────────────────────────────────────────────
// async function buildMaterials(userId) {
//   const classrooms = await Classroom.find({ members: userId }, "_id").lean();
//   const classroomIds = classrooms.map((c) => c._id);

//   const all = await Material.find({ classroomId: { $in: classroomIds } })
//     .populate("courseId", "name code")
//     .lean();

//   // By file-type (inferred from URL extension)
//   const typeMap = { PDF: 0, Slides: 0, Code: 0, Other: 0 };
//   all.forEach((m) => {
//     const ext = (m.fileUrl || "").split(".").pop().toLowerCase();
//     if (ext === "pdf") typeMap.PDF++;
//     else if (["ppt", "pptx"].includes(ext)) typeMap.Slides++;
//     else if (["js", "ts", "py", "java", "cpp", "c", "zip"].includes(ext))
//       typeMap.Code++;
//     else typeMap.Other++;
//   });
//   const byType = Object.entries(typeMap).map(([type, count]) => ({
//     type,
//     count,
//   }));

//   // By course
//   const cMap = {};
//   all.forEach((m) => {
//     const k = m.courseId?._id?.toString() || "__none";
//     const n = m.courseId?.name || "General";
//     if (!cMap[k]) cMap[k] = { course: n, count: 0 };
//     cMap[k].count++;
//   });
//   const byCourse = Object.values(cMap);

//   const weekAgo = subWeeks(new Date(), 1);
//   const thisWeek = all.filter((m) => new Date(m.createdAt) >= weekAgo).length;

//   return { total: all.length, byType, byCourse, thisWeek };
// }

// // ── 5. ENGAGEMENT ────────────────────────────────────────────────────────────
// async function buildEngagement(userId) {
//   const mBuckets = monthBuckets(6);
//   const since = mBuckets[0].start;
//   const classrooms = await Classroom.find({ members: userId }, "_id").lean();
//   const classroomIds = classrooms.map((c) => c._id);

//   const [msgs, notices] = await Promise.all([
//     Message.find({ senderId: userId, createdAt: { $gte: since } }).lean(),
//     Notice.find({
//       classroomId: { $in: classroomIds },
//       createdAt: { $gte: since },
//     }).lean(),
//   ]);

//   const eMap = Object.fromEntries(
//     mBuckets.map((b) => [b.label, { month: b.label, messages: 0, notices: 0 }]),
//   );
//   msgs.forEach((m) => {
//     const l = format(new Date(m.createdAt), "MMM");
//     if (eMap[l]) eMap[l].messages++;
//   });
//   notices.forEach((n) => {
//     const l = format(new Date(n.createdAt), "MMM");
//     if (eMap[l]) eMap[l].notices++;
//   });

//   return mBuckets.map((b) => eMap[b.label]);
// }

// // ── 6. KPIs ──────────────────────────────────────────────────────────────────
// async function buildKpis(userId) {
//   const now = new Date();
//   const monthStart = startOfMonth(now);
//   const weekAgo = subWeeks(now, 1);
//   const LOOKBACK = 60;
//   const lookbackDate = new Date(now);
//   lookbackDate.setDate(lookbackDate.getDate() - LOOKBACK);

//   const classrooms = await Classroom.find({ members: userId }, "_id").lean();
//   const classroomIds = classrooms.map((c) => c._id);

//   const [
//     totalAtt,
//     presentAtt,
//     monthExpenses,
//     totalTasks,
//     completedTasks,
//     activeCourses,
//     materialsThisWeek,
//     attDates,
//     expDates,
//     taskDates,
//   ] = await Promise.all([
//     Attendance.countDocuments({ studentId: userId }),
//     Attendance.countDocuments({ studentId: userId, status: { $ne: "absent" } }),
//     Expense.find({ userId, date: { $gte: monthStart } }).lean(),
//     Task.countDocuments({ userId }),
//     Task.countDocuments({ userId, completed: true }),
//     Course.countDocuments({ classroomId: { $in: classroomIds } }),
//     Material.countDocuments({
//       classroomId: { $in: classroomIds },
//       createdAt: { $gte: weekAgo },
//     }),
//     Attendance.find(
//       { studentId: userId, date: { $gte: lookbackDate } },
//       "date",
//     ).lean(),
//     Expense.find({ userId, date: { $gte: lookbackDate } }, "date").lean(),
//     Task.find(
//       { userId, completed: true, updatedAt: { $gte: lookbackDate } },
//       "updatedAt",
//     ).lean(),
//   ]);

//   const overallAttendance = totalAtt
//     ? Math.round((presentAtt / totalAtt) * 100)
//     : 0;
//   const taskCompletionRate = totalTasks
//     ? Math.round((completedTasks / totalTasks) * 100)
//     : 0;
//   const totalSpentThisMonth = Math.round(
//     monthExpenses.reduce((s, e) => s + (e.amount || 0), 0),
//   );

//   // Streak: consecutive active days going back from today
//   const active = new Set();
//   attDates.forEach((r) => active.add(format(new Date(r.date), "yyyy-MM-dd")));
//   expDates.forEach((r) => active.add(format(new Date(r.date), "yyyy-MM-dd")));
//   taskDates.forEach((r) =>
//     active.add(format(new Date(r.updatedAt), "yyyy-MM-dd")),
//   );

//   let streakDays = 0;
//   const cursor = new Date(now);
//   while (streakDays <= LOOKBACK) {
//     if (!active.has(format(cursor, "yyyy-MM-dd"))) break;
//     streakDays++;
//     cursor.setDate(cursor.getDate() - 1);
//   }

//   return {
//     overallAttendance,
//     totalSpentThisMonth,
//     taskCompletionRate,
//     activeCourses,
//     streakDays,
//     materialsThisWeek,
//   };
// }

// module.exports = router;
