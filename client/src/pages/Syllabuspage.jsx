import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

import {
  BookOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Calendar,
  Settings,
  Edit2,
  Trash2,
  User,
  Clock,
} from "lucide-react";

const SyllabusPage = () => {
  const { classroomId } = useParams();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(null);
  
  const [batchForm, setBatchForm] = useState({
    semester: 1,
    classStartDate: "",
    classEndDate: "",
  });

  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    credits: 3,
    teacher: "",
    classStartDate: "",
    classEndDate: "",
    description: "",
    semester: 1,
  });

  const [chapterTitle, setChapterTitle] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [addTopicFor, setAddTopicFor] = useState(null);
  const [loading, setLoading] = useState(true);

  const canManage = ["teacher", "admin", "class_rep"].includes(user?.role);

  useEffect(() => {
    fetchData();
    api
      .get("/users/teachers")
      .then((r) => setTeachers(r.data))
      .catch(() => {});
  }, [classroomId]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/syllabus/classroom/${classroomId}`);
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch syllabus", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    try {
      await api.post("/syllabus", {
        ...courseForm,
        classroom: classroomId,
        chapters: [],
      });
      setShowAddCourse(false);
      setCourseForm({
        name: "",
        code: "",
        credits: 3,
        teacher: "",
        classStartDate: "",
        classEndDate: "",
        description: "",
        semester: 1,
      });
      fetchData();
    } catch (err) {
      alert("Failed to add course");
    }
  };

  const handleBatchUpdate = async () => {
    try {
      // Endpoint matches the controller logic for updating the entire group
      await api.put(`/syllabus/group/${classroomId}/batch-update`, batchForm);
      setShowBatchUpdate(false);
      fetchData();
      alert("Group settings updated for all courses!");
    } catch (err) {
      alert("Failed to update group settings");
    }
  };

  const handleAddChapter = async (courseId) => {
    if (!chapterTitle.trim()) return;
    try {
      const course = courses.find((c) => c._id === courseId);
      const updatedChapters = [
        ...(course.chapters || []),
        { title: chapterTitle, topics: [] },
      ];
      await api.put(`/syllabus/${courseId}`, { chapters: updatedChapters });
      setChapterTitle("");
      setShowAddChapter(null);
      fetchData();
    } catch (err) {}
  };

  const handleAddTopic = async (courseId, chapterIdx) => {
    if (!topicTitle.trim()) return;
    try {
      const course = courses.find((c) => c._id === courseId);
      const chapters = [...course.chapters];
      chapters[chapterIdx].topics.push({
        title: topicTitle,
        isCompleted: false,
      });
      await api.put(`/syllabus/${courseId}`, { chapters });
      setTopicTitle("");
      setAddTopicFor(null);
      fetchData();
    } catch (err) {}
  };

  const toggleTopic = async (courseId, chapterIdx, topicIdx, current) => {
    if (!canManage) return;
    try {
      await api.put(
        `/syllabus/${courseId}/chapter/${chapterIdx}/topic/${topicIdx}/complete`,
        { isCompleted: !current },
      );
      fetchData();
    } catch (err) {}
  };

  const getProgress = (course) => {
    const total = course.chapters?.reduce((a, ch) => a + ch.topics.length, 0) || 0;
    const done = course.chapters?.reduce((a, ch) => a + ch.topics.filter((t) => t.isCompleted).length, 0) || 0;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <UniLifeLoader size="md" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-600" /> Syllabus
        </h1>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchUpdate(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Group Settings
            </button>
            <button
              onClick={() => setShowAddCourse(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No courses added yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const prog = getProgress(course);
            const isExpanded = expandedCourse === course._id;
            return (
              <div key={course._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 cursor-pointer p-1" onClick={() => setExpandedCourse(isExpanded ? null : course._id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{course.name}</h3>
                      <span className="badge bg-primary-50 text-primary-700 border border-primary-100">{course.code}</span>
                      <span className="badge bg-blue-50 text-blue-700">Sem {course.semester}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <User className="w-4 h-4 text-gray-400" />
                        {course.teacher ? (
                          <span className="text-primary-600 bg-primary-50/50 px-2 py-0.5 rounded">
                            {course.teacher.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic font-normal">No teacher assigned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {course.classStartDate ? new Date(course.classStartDate).toLocaleDateString() : "Start"} — {course.classEndDate ? new Date(course.classEndDate).toLocaleDateString() : "End"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Overall Progress</span>
                        <span className={`font-semibold ${prog.pct >= 75 ? "text-green-600" : "text-primary-600"}`}>
                          {prog.pct}% ({prog.done}/{prog.total} topics)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${prog.pct >= 100 ? "bg-green-500" : "bg-primary-600"}`}
                          style={{ width: `${prog.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1">
                    {isExpanded ? <ChevronDown className="w-6 h-6 text-gray-400" /> : <ChevronRight className="w-6 h-6 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t pt-4 space-y-4">
                    {course.chapters?.map((chapter, ci) => (
                      <div key={ci} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className={`px-4 py-2.5 flex items-center justify-between ${chapter.isCompleted ? "bg-green-50/50" : "bg-gray-50/80"}`}>
                          <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                            {chapter.isCompleted && <Check className="w-4 h-4 text-green-600" />}
                            Chapter {ci + 1}: {chapter.title}
                          </p>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                            {chapter.topics.filter((t) => t.isCompleted).length}/{chapter.topics.length}
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50 bg-white">
                          {chapter.topics.map((topic, ti) => (
                            <div key={ti} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                              <button
                                onClick={() => toggleTopic(course._id, ci, ti, topic.isCompleted)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${topic.isCompleted ? "bg-green-500 border-green-500 shadow-sm shadow-green-200" : "border-gray-300 hover:border-primary-400"}`}
                              >
                                {topic.isCompleted && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                              </button>
                              <span className={`text-sm transition-all ${topic.isCompleted ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                                {topic.title}
                              </span>
                            </div>
                          ))}
                          {canManage && (
                            addTopicFor?.courseId === course._id && addTopicFor?.ci === ci ? (
                              <div className="p-3 bg-primary-50/30 flex gap-2">
                                <input
                                  className="input text-sm flex-1 bg-white"
                                  placeholder="New topic title..."
                                  value={topicTitle}
                                  onChange={(e) => setTopicTitle(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && handleAddTopic(course._id, ci)}
                                  autoFocus
                                />
                                <button onClick={() => handleAddTopic(course._id, ci)} className="btn-primary py-1 px-4 text-sm">Add</button>
                                <button onClick={() => setAddTopicFor(null)} className="btn-secondary py-1 px-3 text-sm">×</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddTopicFor({ courseId: course._id, ci })}
                                className="w-full px-4 py-2 text-left text-xs font-semibold text-primary-600 hover:bg-primary-50 flex items-center gap-1.5 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add New Topic
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}

                    {canManage && (
                      showAddChapter === course._id ? (
                        <div className="flex gap-2 p-1">
                          <input
                            className="input text-sm flex-1"
                            placeholder="Enter chapter title..."
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => handleAddChapter(course._id)} className="btn-primary py-1.5 px-4 text-sm">Save Chapter</button>
                          <button onClick={() => setShowAddChapter(null)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddChapter(course._id)}
                          className="btn-secondary text-sm flex items-center gap-2 py-2 w-full justify-center border-dashed"
                        >
                          <Plus className="w-4 h-4" /> Add Course Chapter
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Group Global Settings (Batch Update) */}
      {showBatchUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
                  <Settings className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-xl text-gray-900">Group Settings</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This will update the <b>Semester</b> and <b>Schedule</b> for every course in this group simultaneously.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Current Academic Semester</label>
                <select
                  className="input"
                  value={batchForm.semester}
                  onChange={(e) => setBatchForm(p => ({ ...p, semester: parseInt(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class Start Date</label>
                  <input
                    className="input"
                    type="date"
                    value={batchForm.classStartDate}
                    onChange={(e) => setBatchForm(p => ({ ...p, classStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Class End Date</label>
                  <input
                    className="input"
                    type="date"
                    value={batchForm.classEndDate}
                    onChange={(e) => setBatchForm(p => ({ ...p, classEndDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleBatchUpdate} className="btn-primary flex-1 py-2.5">Apply to Group</button>
              <button onClick={() => setShowBatchUpdate(false)} className="btn-secondary flex-1 py-2.5">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Course */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold text-xl mb-5 flex items-center gap-2">
               <BookOpen className="w-5 h-5 text-primary-600" /> Create New Course
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Course Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Data Structures"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Course Code *</label>
                  <input
                    className="input"
                    placeholder="e.g. ICE3101"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm((p) => ({ ...p, code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Credits</label>
                  <input
                    className="input"
                    type="number"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm((p) => ({ ...p, credits: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Assign Lecturer *</label>
                <select
                  className="input"
                  value={courseForm.teacher}
                  onChange={(e) => setCourseForm((p) => ({ ...p, teacher: e.target.value }))}
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Course Start Date (Default)</label>
                  <input
                    className="input"
                    type="date"
                    value={courseForm.classStartDate}
                    onChange={(e) => setCourseForm((p) => ({ ...p, classStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Course End Date (Default)</label>
                  <input
                    className="input"
                    type="date"
                    value={courseForm.classEndDate}
                    onChange={(e) => setCourseForm((p) => ({ ...p, classEndDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Brief Description</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Enter course objectives..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handleAddCourse} className="btn-primary flex-1 py-2.5">Create Course</button>
              <button onClick={() => setShowAddCourse(false)} className="btn-secondary flex-1 py-2.5">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusPage;