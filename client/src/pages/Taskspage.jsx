import React, { useEffect, useState } from "react";
import api from "../utils/Api";
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  Clock,
  Target,
  Repeat,
} from "lucide-react";
import FocusTimer from "./FocusTimer"; // IMPORTS NEW COMPONENT
import UniLifeLoader from "../components/Loader/UniLifeLoader";

const priorityColors = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};
const statusColors = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);

  const [activePomodoro, setActivePomodoro] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "medium",
    category: "general",
    isHabit: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchData();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [classRes] = await Promise.all([api.get("/classrooms")]);
      setClassrooms(classRes.data);
      if (classRes.data.length > 0) {
        const syllabusRes = await api.get(
          `/syllabus/classroom/${classRes.data[0]._id}`,
        );
        setCourses(syllabusRes.data);
      }
    } catch (err) {}
  };

  const handleSave = async () => {
    try {
      let finalDueDate = form.dueDate;
      if (form.dueDate && form.dueTime) {
        finalDueDate = new Date(
          `${form.dueDate}T${form.dueTime}`,
        ).toISOString();
      }

      let finalDesc = form.description || "";
      if (form.isHabit && !finalDesc.includes("[HABIT]")) {
        finalDesc = `[HABIT] ${finalDesc}`;
      } else if (!form.isHabit) {
        finalDesc = finalDesc
          .replace("[HABIT] ", "")
          .replace("[HABIT]", "")
          .trim();
      }

      const payload = {
        title: form.title,
        description: finalDesc,
        dueDate: finalDueDate,
        priority: form.priority,
        category: form.category,
      };

      if (editTask) await api.put(`/tasks/${editTask._id}`, payload);
      else await api.post("/tasks", payload);

      setShowAdd(false);
      setEditTask(null);
      setForm({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        priority: "medium",
        category: "general",
        isHabit: false,
      });
      fetchTasks();
    } catch (err) {
      alert("Failed to save task");
    }
  };

  const toggleStatus = async (task) => {
    const next =
      task.status === "todo"
        ? "in_progress"
        : task.status === "in_progress"
          ? "done"
          : "todo";
    try {
      await api.put(`/tasks/${task._id}`, { status: next });
      // If task is marked done, hide it from active timer
      if (activePomodoro && activePomodoro._id === task._id && next === "done")
        setActivePomodoro(null);
      fetchTasks();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      if (activePomodoro && activePomodoro._id === id) setActivePomodoro(null);
      fetchTasks();
    } catch (err) {}
  };

  const openEdit = (task) => {
    setEditTask(task);
    const desc = task.description || "";
    const isHabit = desc.includes("[HABIT]");
    const cleanDesc = desc
      .replace("[HABIT] ", "")
      .replace("[HABIT]", "")
      .trim();

    let datePart = "";
    let timePart = "";
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      datePart = d.toISOString().split("T")[0];
      timePart = d.toTimeString().slice(0, 5);
    }

    setForm({
      title: task.title,
      description: cleanDesc,
      dueDate: datePart,
      dueTime: timePart,
      priority: task.priority,
      category: task.category,
      isHabit: isHabit,
    });
    setShowAdd(true);
  };

  // --- NEW: Smooth Auto-Scroll Trigger ---
  const startPomodoro = (task) => {
    setActivePomodoro(task);
    setTimeout(() => {
      document
        .getElementById("focus-timer-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // --- NEW: Dynamic Task Sorting (Done tasks sent to bottom) ---
  const baseFiltered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const sortedTasks = [...baseFiltered].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return 0; // Maintain natural timeline/order for others
  });

  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-primary-600" /> My Tasks
        </h1>
        <button
          onClick={() => {
            setEditTask(null);
            setForm({
              title: "",
              description: "",
              dueDate: "",
              dueTime: "",
              priority: "medium",
              category: "general",
              isHabit: false,
            });
            setShowAdd(true);
          }}
          className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* FOCUS TIMER COMPONENT (Imported) */}
      {activePomodoro && (
        <FocusTimer
          task={activePomodoro}
          onClose={() => setActivePomodoro(null)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ["todo", "To Do", "bg-white border border-gray-200"],
          ["in_progress", "In Progress", "bg-blue-50 border border-blue-100"],
          ["done", "Done", "bg-green-50 border border-green-100"],
        ].map(([s, label, bg]) => (
          <div
            key={s}
            className={`card ${bg} text-center cursor-pointer transition-all hover:shadow-md ${filter === s ? "ring-2 ring-primary-500 scale-[1.02]" : ""}`}
            onClick={() => setFilter(filter === s ? "all" : s)}
          >
            <p
              className={`text-2xl font-bold ${s === "done" ? "text-green-600" : s === "in_progress" ? "text-blue-600" : "text-gray-900"}`}
            >
              {counts[s]}
            </p>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 bg-gray-100 p-1.5 rounded-xl w-max">
        {["all", "todo", "in_progress", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <UniLifeLoader size="md" />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="card text-center py-12 border-dashed border-2">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No tasks found here. You're all caught up!
              </p>
            </div>
          ) : (
            // Render from sortedTasks array
            sortedTasks.map((task) => {
              const isHabit = task.description?.includes("[HABIT]");
              const cleanDesc = task.description?.replace("[HABIT]", "").trim();

              return (
                <div
                  key={task._id}
                  className={`bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 group transition-all hover:shadow-md ${task.status === "done" ? "opacity-60 bg-gray-50 border-dashed" : ""}`}
                >
                  <button
                    onClick={() => toggleStatus(task)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === "done" ? "bg-green-500 border-green-500 text-white" : task.status === "in_progress" ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-primary-400"}`}
                  >
                    {task.status === "done" && <Check className="w-4 h-4" />}
                    {task.status === "in_progress" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-lg font-bold text-gray-900 ${task.status === "done" ? "line-through text-gray-500" : ""}`}
                      >
                        {task.title}
                      </p>
                      {isHabit && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase flex items-center gap-1">
                          <Repeat className="w-3 h-3" /> Habit
                        </span>
                      )}
                    </div>

                    {cleanDesc && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {cleanDesc}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span
                        className={`badge ${priorityColors[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      <span className={`badge ${statusColors[task.status]}`}>
                        {task.status.replace("_", " ")}
                      </span>
                      {task.category !== "general" && (
                        <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {task.category}
                        </span>
                      )}

                      {task.dueDate && (
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-md ${new Date(task.dueDate) < new Date() && task.status !== "done" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
                        >
                          <Clock className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                          {task.dueDate.includes("T") &&
                          task.dueDate.split("T")[1] !== "00:00:00.000Z"
                            ? ` • ${new Date(task.dueDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status !== "done" && (
                      <button
                        onClick={() => startPomodoro(task)}
                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors"
                        title="Start Focus Timer"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(task)}
                      className="p-2 bg-gray-50 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="p-2 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add/Edit modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-bold text-xl mb-6 text-gray-900 border-b border-gray-100 pb-3">
              {editTask ? "Edit Task" : "Create New Task"}
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="What needs to be done?"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Task Type
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, isHabit: !p.isHabit }))
                    }
                    className={`w-full py-2.5 px-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${form.isHabit ? "bg-purple-100 border-purple-300 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"}`}
                  >
                    {form.isHabit ? (
                      <>
                        <Repeat className="w-4 h-4" /> Habit
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" /> One-time
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  rows={2}
                  placeholder="Add details or notes..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dueDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    type="time"
                    value={form.dueTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dueTime: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, priority: e.target.value }))
                    }
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category / Course
                  </label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    <option value="general">General</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8 border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditTask(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
              >
                {editTask ? "Update Task" : "Save Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
