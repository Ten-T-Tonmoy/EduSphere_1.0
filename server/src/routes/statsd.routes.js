// const now = new Date();
// const d = (daysAgo) => new Date(now - daysAgo * 864e5).toISOString();
// const wk = (weeksAgo, dayOfWeek = 1) =>
//   new Date(now - (weeksAgo * 7 - dayOfWeek) * 864e5).toISOString();
// const mo = (monthsAgo, day = 10) => {
//   const x = new Date(now);
//   x.setMonth(x.getMonth() - monthsAgo);
//   x.setDate(day);
//   return x.toISOString();
// };

// // ── Shared IDs ─────────────────────────────────────────────────────────────
// const COURSES = [
//   { _id: "c1", name: "Operating Systems", code: "ICE-401" },
//   { _id: "c2", name: "Compiler Design", code: "ICE-403" },
//   { _id: "c3", name: "Computer Networks", code: "ICE-405" },
//   { _id: "c4", name: "Artificial Intelligence", code: "ICE-407" },
//   { _id: "c5", name: "Software Engineering", code: "ICE-409" },
// ];

// const CLASSROOMS = [{ _id: "r1", name: "ICE-8th Semester A" }];

// // ── attendance ─────────────────────────────────────────────────────────────
// // ~6 classes/week across 5 courses, 12 weeks back
// // status: "present" | "absent" | "late"
// const attendance = [];
// const STATUSES = [
//   "present",
//   "present",
//   "present",
//   "present",
//   "present",
//   "absent",
//   "late",
// ];
// let aid = 1;
// COURSES.forEach((c) => {
//   for (let week = 0; week < 12; week++) {
//     // 2-3 slots per course per week
//     const slots = c._id === "c2" ? 2 : 3;
//     for (let s = 0; s < slots; s++) {
//       const dayOffset = week * 7 + s * 2;
//       attendance.push({
//         _id: `att_${aid++}`,
//         courseId: c,
//         date: d(dayOffset + 1),
//         status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
//         createdAt: d(dayOffset + 1),
//       });
//     }
//   }
// });

// // ── expenses ───────────────────────────────────────────────────────────────
// const EXPENSE_SEEDS = [
//   // [category, amount, daysAgo]
//   ["food", 120, 1],
//   ["food", 95, 2],
//   ["food", 140, 3],
//   ["food", 110, 5],
//   ["food", 130, 6],
//   ["food", 105, 8],
//   ["food", 125, 10],
//   ["food", 115, 12],
//   ["food", 140, 14],
//   ["food", 100, 16],
//   ["food", 120, 18],
//   ["food", 135, 20],
//   ["food", 110, 22],
//   ["food", 145, 24],
//   ["food", 125, 26],
//   ["food", 115, 28],
//   ["food", 130, 32],
//   ["food", 120, 36],
//   ["food", 110, 40],
//   ["food", 105, 44],
//   ["food", 115, 50],
//   ["food", 125, 55],
//   ["food", 130, 60],
//   ["food", 120, 65],
//   ["food", 110, 70],
//   ["food", 140, 75],
//   ["food", 100, 80],
//   ["food", 120, 85],
//   ["food", 115, 90],
//   ["food", 130, 95],
//   ["food", 125, 100],
//   ["food", 110, 110],
//   ["food", 120, 120],
//   ["food", 135, 130],
//   ["food", 100, 140],
//   ["food", 120, 150],

//   ["transport", 40, 1],
//   ["transport", 35, 3],
//   ["transport", 50, 7],
//   ["transport", 40, 10],
//   ["transport", 45, 14],
//   ["transport", 35, 18],
//   ["transport", 40, 22],
//   ["transport", 50, 28],
//   ["transport", 35, 35],
//   ["transport", 40, 42],
//   ["transport", 45, 50],
//   ["transport", 38, 58],
//   ["transport", 42, 65],
//   ["transport", 36, 72],
//   ["transport", 44, 80],
//   ["transport", 38, 90],
//   ["transport", 40, 100],
//   ["transport", 35, 110],
//   ["transport", 45, 120],
//   ["transport", 40, 130],
//   ["transport", 38, 140],
//   ["transport", 42, 150],
//   ["transport", 36, 160],
//   ["transport", 44, 170],

//   ["books", 350, 15],
//   ["books", 220, 40],
//   ["books", 180, 75],
//   ["books", 400, 110],
//   ["books", 150, 145],
//   ["stationery", 80, 20],
//   ["stationery", 60, 55],
//   ["printing", 45, 8],
//   ["printing", 30, 35],
//   ["photocopy", 25, 12],
//   ["photocopy", 20, 48],

//   ["meal", 130, 4],
//   ["meal", 115, 9],
//   ["meal", 125, 15],
//   ["meal", 110, 21],
//   ["meal", 135, 30],
//   ["meal", 120, 38],
//   ["meal", 115, 46],
//   ["meal", 125, 55],

//   ["other", 500, 25],
//   ["other", 300, 60],
//   ["other", 200, 95],
//   ["other", 450, 130],
//   ["other", 150, 160],
// ];

// const expenses = EXPENSE_SEEDS.map(([category, amount, daysAgo], i) => ({
//   _id: `exp_${i + 1}`,
//   category,
//   amount,
//   date: d(daysAgo),
//   createdAt: d(daysAgo),
// }));

// // ── tasks ──────────────────────────────────────────────────────────────────
// const TASK_SEEDS = [
//   // [courseIdx, title, daysUntilDue (neg = past), completed, createdDaysAgo]
//   [0, "Assignment 1 – Process Scheduling", -20, true, 55],
//   [0, "Lab Report – Memory Management", -10, true, 45],
//   [0, "Quiz Prep – File Systems", 5, false, 3],
//   [0, "Project – Deadlock Simulation", 10, false, 10],
//   [0, "Assignment 2 – Virtual Memory", -5, false, 8], // overdue

//   [1, "Lexer Implementation", -15, true, 50],
//   [1, "Parser – LL(1) Grammar", -8, true, 40],
//   [1, "Semantic Analysis Notes", -3, false, 5], // overdue
//   [1, "Code Generation Report", 7, false, 7],
//   [1, "Mid-term Revision", -2, false, 4], // overdue

//   [2, "Wireshark Lab", -18, true, 52],
//   [2, "TCP/IP Assignment", -12, true, 45],
//   [2, "Routing Protocol Essay", -6, true, 38],
//   [2, "Network Security Quiz", 3, false, 2],
//   [2, "Socket Programming Project", 14, false, 12],

//   [3, "Search Algorithm Comparison", -14, true, 48],
//   [3, "Neural Network Lab", -7, true, 42],
//   [3, "A* Pathfinding Implementation", 8, false, 6],
//   [3, "ML Model Evaluation", -1, false, 3], // overdue

//   [4, "Requirements Document", -20, true, 55],
//   [4, "UML Diagrams", -10, true, 45],
//   [4, "Test Plan", -5, true, 38],
//   [4, "Sprint Retrospective", 5, false, 4],
//   [4, "Final Project Report", 20, false, 15],
// ];

// const tasks = TASK_SEEDS.map(
//   ([cIdx, title, dueDelta, completed, createdDaysAgo], i) => {
//     const dueDate = new Date(now);
//     dueDate.setDate(dueDate.getDate() + dueDelta);
//     const updatedAt = completed ? d(createdDaysAgo - 3) : d(createdDaysAgo);
//     return {
//       _id: `task_${i + 1}`,
//       relatedCourseId: COURSES[cIdx],
//       title,
//       dueDate: dueDate.toISOString(),
//       completed,
//       createdAt: d(createdDaysAgo),
//       updatedAt,
//     };
//   },
// );

// // ── materials ──────────────────────────────────────────────────────────────
// const MAT_SEEDS = [
//   [0, "lecture1.pdf"],
//   [0, "lecture2.pdf"],
//   [0, "lab_manual.pdf"],
//   [0, "slides_week1.pptx"],
//   [0, "slides_week2.pptx"],
//   [0, "process_sim.py"],
//   [0, "memory_notes.pdf"],

//   [1, "compiler_intro.pdf"],
//   [1, "grammar_slides.pptx"],
//   [1, "lexer_starter.zip"],
//   [1, "parser_notes.pdf"],
//   [1, "semantic_guide.pdf"],

//   [2, "networks_ch1.pdf"],
//   [2, "networks_ch2.pdf"],
//   [2, "tcp_slides.pptx"],
//   [2, "wireshark_lab.pdf"],
//   [2, "routing_notes.pdf"],
//   [2, "socket_template.js"],

//   [3, "ai_intro.pdf"],
//   [3, "search_algorithms.pdf"],
//   [3, "neural_net_slides.pptx"],
//   [3, "astar_code.py"],
//   [3, "ml_datasets.zip"],

//   [4, "swe_process.pdf"],
//   [4, "uml_guide.pdf"],
//   [4, "test_strategies.pdf"],
//   [4, "agile_slides.pptx"],
//   [4, "project_template.docx"],
// ];

// const materials = MAT_SEEDS.map(([cIdx, fileUrl], i) => ({
//   _id: `mat_${i + 1}`,
//   courseId: COURSES[cIdx],
//   classroomId: CLASSROOMS[0]._id,
//   fileUrl,
//   createdAt: d(Math.floor(Math.random() * 80)),
// }));

// // ── messages ───────────────────────────────────────────────────────────────
// const messages = Array.from({ length: 87 }, (_, i) => ({
//   _id: `msg_${i + 1}`,
//   classroomId: CLASSROOMS[0]._id,
//   createdAt: d(Math.floor(Math.random() * 180)),
// }));

// // ── notices ────────────────────────────────────────────────────────────────
// const notices = Array.from({ length: 32 }, (_, i) => ({
//   _id: `ntc_${i + 1}`,
//   classroomId: CLASSROOMS[0]._id,
//   createdAt: d(Math.floor(Math.random() * 180)),
// }));

// // ── Export ─────────────────────────────────────────────────────────────────
// const DUMMY = {
//   success: true,
//   data: {
//     attendance,
//     expenses,
//     tasks,
//     materials,
//     messages,
//     notices,
//     courses: COURSES,
//     classrooms: CLASSROOMS,
//   },
// };

// export default DUMMY;
