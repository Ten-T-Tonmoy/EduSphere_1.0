import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Bell, MessageCircleMore, FileText, MicVocal } from 'lucide-react';
import UniLifeLoader from '../../../components/Loader/UniLifeLoader';

const NotificationLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/notifications/logs');
      setLogs(res.data.logs);
      await api.put('/notifications/read'); // Mark as read when viewing page
    } catch (error) {
      console.error("Error fetching logs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (log) => {
    // ✅ FIX: Intercept "notice" types FIRST so it ignores the backend actionUrl
    if (log.type === 'notice') {
      navigate('/manage-groups');
      return;
    }

    // 1. If it has a valid, specific actionUrl (like /chat?user=123), use it directly
    if (log.actionUrl && log.actionUrl !== '/') {
      navigate(log.actionUrl);
      return;
    }

    // 2. Smart Fallbacks for older logs
    if (log.type === 'chat') {
      navigate('/chat');
    } else if (log.type === 'DOC_READY') {
      navigate('/manage-groups');
    } else {
      navigate('/dashboard'); // Ultimate safety fallback
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Notification History</h1>
      {loading ? (
        <UniLifeLoader text="Loading notification history..." className="text-center" />
      ) : logs.length === 0 ? (
        <p className="text-gray-500">No notifications found.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div 
              key={log._id} 
              onClick={() => handleNavigation(log)} 
              className={`p-4 rounded-xl border cursor-pointer transition-shadow hover:shadow-md ${log.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    {log.type === 'chat' ? <MessageCircleMore className="w-6 h-6 text-green-500" /> : log.type === 'notice' ? <MicVocal className="w-6 h-6 text-red-600" /> : log.type === 'DOC_READY' ? <FileText className="w-6 h-6 text-red-400" /> : <Bell className="w-5 h-5 text-green-500" />}
                    {log.title}
                    {log.priority === 'high' && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">High Priority</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{log.body}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationLogPage;