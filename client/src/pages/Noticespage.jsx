import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import { Bell, Plus, Trash2, AlertTriangle, Info, AlertCircle } from "lucide-react";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

const priorityStyles = {
  low: { color: "bg-gray-100 text-gray-600", icon: Info },
  normal: { color: "bg-blue-100 text-blue-700", icon: Bell },
  high: { color: "bg-orange-100 text-orange-700", icon: AlertCircle },
  urgent: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const NoticesPage = () => {
  const { classroomId } = useParams();
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    expiresAt: "",
  });
  const [loading, setLoading] = useState(true);

  const canPost = ["teacher", "admin", "class_rep", "cr"].includes(user?.role);

  useEffect(() => {
    fetchNotices();
  }, [classroomId]);

  const fetchNotices = async () => {
    try {
      const res = await api.get(`/notices/classroom/${classroomId}`);
      setNotices(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // FIX: Hardcoded backend requirements to satisfy MongoDB
      const payload = { 
        ...form, 
        classroom: classroomId,
        postedBy: user._id 
      };
      
      if (!payload.expiresAt) delete payload.expiresAt;
      await api.post("/notices", payload);
      setShowCreate(false);
      setForm({ title: "", content: "", priority: "normal", expiresAt: "" });
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create notice");
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notices/${id}/read`);
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {}
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-indigo-600" /> Notices
        </h1>
        {canPost && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <UniLifeLoader size="md" />
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notices posted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const { color, icon: Icon } = priorityStyles[notice.priority] || priorityStyles.normal;
            const isRead = notice.readBy?.includes(user._id);
            return (
              <div key={notice._id} className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-shadow ${!isRead ? "border-l-4 border-l-indigo-500 border-gray-200" : "border-gray-200"}`} onClick={() => markRead(notice._id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-semibold ${!isRead ? "text-gray-900" : "text-gray-700"}`}>{notice.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${color}`}>{notice.priority}</span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{notice.content}</p>
                    </div>
                  </div>
                  {canPost && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(notice._id); }} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-xl mb-4 text-gray-900">Post Notice</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title *</label>
                <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Notice title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content *</label>
                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" rows={4} placeholder="Notice content..." value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expires At</label>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" type="date" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Post Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;