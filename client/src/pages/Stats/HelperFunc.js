function toMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthLabel(date) {
  return new Date(date).toLocaleString("en", { month: "short" }); // "Jan"
}

function makeWeekBuckets(n) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (n - 1 - i) * 7);
    const start = toMonday(d);
    return { ms: start.getTime(), label: `W${i + 1}` };
  });
}

function makeMonthBuckets(n) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { monthStr, label: monthLabel(d) };
  });
}

function isoMonth(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── 1. attendance ─────────────────────────────────────────────────────────────
function processAttendance(rows) {
  const cMap = {};

  rows.forEach((r) => {
    const id = r.course?._id || r.course || "unknown";
    const name = r.course?.name || id;
    const code = r.course?.code || "";

    if (!cMap[id]) {
      cMap[id] = { course: code, name: name, total: 0, present: 0, absent: 0 };
    }

    cMap[id].total++;

    const s = (r.status || "").toLowerCase();
    // Support all matrix absence formats
    if (s === "missed" || s === "absent" || s === "a") {
      cMap[id].absent++;
    } else {
      // P, present, attended, or late counts as present for the breakdown
      cMap[id].present++;
    }
  });

  // Data specifically for the new "Courses Breakdown" stacked bar chart
  const coursesBreakdown = Object.values(cMap).map((c) => ({
    name: c.course || c.name.substring(0, 15), // Uses course code if available, else short name
    fullName: c.name,
    present: c.present,
    absent: c.absent,
    total: c.total,
  }));

  // Data for the Per-Course % Progress Bars
  const byCourse = Object.values(cMap).map((c) => ({
    course: c.course || c.name,
    name: c.name,
    pct: c.total ? Math.round((c.present / c.total) * 100) : 0,
  }));

  const totalPresent = coursesBreakdown.reduce((s, c) => s + c.present, 0);
  const totalRecords = coursesBreakdown.reduce((s, c) => s + c.total, 0);
  const overall = totalRecords ? Math.round((totalPresent / totalRecords) * 100) : 0;

  return { coursesBreakdown, byCourse, overall };
}

// ── 2. expenses ───────────────────────────────────────────────────────────────
const CAT_MAP = {
  food: "food", meal: "food", dining: "food", lunch: "food", breakfast: "food", dinner: "food", snack: "food",
  transport: "transport", travel: "transport", commute: "transport", bus: "transport", rickshaw: "transport", uber: "transport", ride: "transport",
  books: "books", book: "books", stationery: "books", supplies: "books", printing: "books", photocopy: "books",
};
const CAT_COLORS = { food: "#f97316", transport: "#3b82f6", books: "#8b5cf6", other: "#6b7280" };

function processExpenses(rows) {
  const mBuckets = makeMonthBuckets(6);

  const monthMap = Object.fromEntries(
    mBuckets.map((b) => [b.monthStr, { month: b.label, food: 0, transport: 0, books: 0, other: 0 }])
  );
  rows.forEach((r) => {
    const key = isoMonth(r.date);
    if (!monthMap[key]) return;
    const cat = CAT_MAP[(r.category || "").toLowerCase()] || "other";
    monthMap[key][cat] += r.amount || 0;
  });
  const monthly = mBuckets.map((b) => {
    const m = monthMap[b.monthStr];
    return {
      month: m.month,
      food: Math.round(m.food),
      transport: Math.round(m.transport),
      books: Math.round(m.books),
      other: Math.round(m.other),
    };
  });

  const totals = { food: 0, transport: 0, books: 0, other: 0 };
  rows.forEach((r) => {
    const cat = CAT_MAP[(r.category || "").toLowerCase()] || "other";
    totals[cat] += (r.type === "expense" && r.amount) || 0;
  });
  const categories = Object.entries(totals).map(([k, v]) => ({
    category: k.charAt(0).toUpperCase() + k.slice(1),
    amount: Math.round(v),
    color: CAT_COLORS[k],
  }));

  const thisMonthStr = isoMonth(new Date());
  const thisMonth = Math.round(
    rows
      .filter((r) => isoMonth(r.date) === thisMonthStr)
      .reduce((s, r) => s + ((r.type === "expense" && r.amount) || 0), 0),
  );

  return { monthly, categories, thisMonth };
}

// ── 3. tasks ──────────────────────────────────────────────────────────────────
function processTasks(rows) {
  const now = new Date();
  const wBuckets = makeWeekBuckets(8);
  const since = new Date(wBuckets[0].ms);

  const completed = rows.filter((t) => t.status === "done").length;
  const overdue = rows.filter(
    (t) => !t.status === "done" && t.status === "in_progress" && new Date(t.dueDate) < now
  ).length;
  const pending = rows.filter(
    (t) => t.status === "in_progress" && (!t.dueDate || new Date(t.dueDate) >= now)
  ).length;

  const cMap = {};
  rows.forEach((t) => {
    const k = t.relatedCourse?._id || "__none";
    const n = t.relatedCourse?.name || "General";
    if (!cMap[k]) cMap[k] = { course: n, completed: 0, pending: 0, overdue: 0 };
    if (t.status === "done") cMap[k].completed++;
    else if (t.dueDate && new Date(t.dueDate) < now) cMap[k].overdue++;
    else cMap[k].pending++;
  });
  const byCourse = Object.values(cMap);

  const weekMap = Object.fromEntries(
    wBuckets.map((b) => [b.ms, { week: b.label, added: 0, completed: 0 }])
  );
  rows.forEach((t) => {
    if (new Date(t.createdAt) >= since) {
      const ms = toMonday(t.createdAt).getTime();
      if (weekMap[ms]) weekMap[ms].added++;
    }
    if (t.status === "done" && t.updatedAt && new Date(t.updatedAt) >= since) {
      const ms = toMonday(t.updatedAt).getTime();
      if (weekMap[ms]) weekMap[ms].completed++;
    }
  });
  const weeklyCompletion = wBuckets.map((b) => weekMap[b.ms]);

  return { total: rows.length, completed, pending, overdue, byCourse, weeklyCompletion };
}

// ── 4. materials ──────────────────────────────────────────────────────────────
function processMaterials(rows) {
  const typeMap = { PDF: 0, Slides: 0, Code: 0, Other: 0 };
  const cMap = {};
  let totalFiles = 0;

  rows.forEach((row) => {
    // Check if the row contains an array of attachments, or is a direct file object
    const files = (row.attachments && Array.isArray(row.attachments) && row.attachments.length > 0) 
        ? row.attachments 
        : [row]; 
    
    files.forEach((m) => {
      totalFiles++;
      const fType = (m.fileType || "").toLowerCase();
      const fName = (m.fileName || "").toLowerCase();

      if (fType.includes("pdf") || fName.endsWith(".pdf")) {
        typeMap.PDF++;
      } else if (fType.includes("image") || fType.includes("presentation") || fName.match(/\.(ppt|pptx)$/)) {
        typeMap.Slides++;
      } else if (fType.includes("code") || fType.includes("javascript") || fType.includes("json") || fName.match(/\.(js|jsx|py|cpp|c|html|css|txt)$/)) {
        typeMap.Code++;
      } else {
        typeMap.Other++; 
      }
    });

    // 🎯 STRICT GROUP LOGIC: Identify the correct Group or Source
    let sourceId = "__none";
    let sourceName = "Personal / Direct";

    if (row.group) {
        // Matches Important Materials or Notice attachments tied to a specific Group
        sourceId = row.group._id || row.group;
        sourceName = row.group.name || "Group Material";
    } else if (row.sharedWithGroups && row.sharedWithGroups.length > 0) {
        // Matches Notes shared with the full Group
        const firstGroup = row.sharedWithGroups[0];
        sourceId = firstGroup._id || firstGroup;
        sourceName = firstGroup.name || "Shared with Group";
    } else if (row.teacher) {
        // Matches Notes tied to a Teacher Profile
        sourceId = row.teacher._id || row.teacher;
        sourceName = row.teacher.name ? `${row.teacher.name}` : "Teacher Notes";
    } else if (row.course) {
        // Fallback for general course files
        sourceId = row.course._id || row.course;
        sourceName = row.course.name || "Course Material";
    }

    const fileCount = files.length;
    
    // We map it to "course" key because the PieChart uses nameKey="course"
    if (!cMap[sourceId]) cMap[sourceId] = { course: sourceName, count: 0 };
    cMap[sourceId].count += fileCount;
  });

  // Clean up UI badges (hides categories with 0 files)
  let byType = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .filter(t => t.count > 0);
  
  if (byType.length === 0 && totalFiles > 0) {
      byType = [{ type: "Notes", count: totalFiles }];
  }

  const byCourse = Object.values(cMap);

  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const thisWeek = rows.filter((m) => new Date(m.createdAt) >= weekAgo).length;

  return { total: totalFiles, byType, byCourse, thisWeek };
}

// ── 5. engagement ─────────────────────────────────────────────────────────────
function processEngagement(messages, notices) {
  const mBuckets = makeMonthBuckets(6);
  const eMap = Object.fromEntries(mBuckets.map((b) => [b.monthStr, { month: b.label, messages: 0, notices: 0 }]));
  messages.forEach((m) => {
    const k = isoMonth(m.createdAt);
    if (eMap[k]) eMap[k].messages++;
  });
  notices.forEach((n) => {
    const k = isoMonth(n.createdAt);
    if (eMap[k]) eMap[k].notices++;
  });
  return mBuckets.map((b) => eMap[b.monthStr]);
}

// ── 6. KPIs ───────────────────────────────────────────────────────────────────
function processKpis(raw) {
  const { attendance, expenses, tasks, materials, messages, notices, courses } = raw;
  const now = new Date();

  // Make sure KPI perfectly matches matrix P/A format
  const totalAtt = attendance.length;
  const presentAtt = attendance.filter((r) => {
      const s = (r.status || "").toLowerCase();
      return s !== "missed" && s !== "absent" && s !== "a";
  }).length;
  const overallAttendance = totalAtt ? Math.round((presentAtt / totalAtt) * 100) : 0;

  const thisMonthStr = isoMonth(now);
  const totalSpentThisMonth = Math.round(
    expenses.filter((e) => isoMonth(e.date) === thisMonthStr).reduce((s, e) => s + ((e.type === "expense" && e.amount) || 0), 0)
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeCourses = courses.length;
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const materialsThisWeek = materials.filter((m) => new Date(m.createdAt) >= weekAgo).length;

  const active = new Set();
  const fmt = (d) => new Date(d).toISOString().slice(0, 10);
  attendance.forEach((r) => active.add(fmt(r.date)));
  expenses.forEach((e) => active.add(fmt(e.date)));
  tasks.filter((t) => t.completed && t.updatedAt).forEach((t) => active.add(fmt(t.updatedAt)));

  let streakDays = 0;
  const cursor = new Date(now);
  while (streakDays < 150) {
    if (!active.has(fmt(cursor))) break;
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { overallAttendance, totalSpentThisMonth, taskCompletionRate, activeCourses, streakDays, materialsThisWeek };
}

// --------------------------process all--------------------------------
function processAll(raw) {
  const att = processAttendance(raw.attendance);
  const exp = processExpenses(raw.expenses);
  const tsk = processTasks(raw.tasks);
  const mats = processMaterials(raw.materials);
  const eng = processEngagement(raw.messages, raw.notices);
  const kpis = processKpis(raw);
  
  return {
    attendance: att.coursesBreakdown, // Switched from weekly to course breakdown data
    courseAttendance: att.byCourse,
    overallAttendance: att.overall,
    expenses: exp.monthly,
    expenseCategories: exp.categories,
    thisMonthSpend: exp.thisMonth,
    tasks: tsk,
    materials: mats,
    engagement: eng,
    kpis,
  };
}

const COLORS = {
  blue: "#3b82f6", indigo: "#6366f1", violet: "#8b5cf6", emerald: "#10b981", amber: "#f59e0b", orange: "#f97316", red: "#ef4444", gray: "#6b7280",
};

export {
  CAT_COLORS, isoMonth, makeMonthBuckets, makeWeekBuckets, monthLabel, processAll, processAttendance, processEngagement, processExpenses, processKpis, processMaterials, processTasks, toMonday, COLORS,
};