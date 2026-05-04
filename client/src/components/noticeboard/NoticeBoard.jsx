import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext'; 
import CreateNotice from './CreateNotice';
import NoticeCard from './NoticeCard';
import api from '../../utils/Api'; 
import './NoticeBoard.css'; 
import UniLifeLoader from '../Loader/UniLifeLoader'; // NEW: Importing the loader component

const NoticeBoard = (props) => {
  const params = useParams();
  const { user } = useAuth();

  const resolveActiveId = () => {
    if (props.groupId) return props.groupId;
    if (props.classroomId) return props.classroomId;
    if (params.classroomId) return params.classroomId;
    if (params.groupId) return params.groupId;
    if (params.id) return params.id;
    
    if (user?.groups && user.groups.length > 0) {
      const g = user.groups[0];
      if (typeof g === 'string') return g;
      if (g.group && typeof g.group === 'string') return g.group;
      if (g.group && g.group._id) return g.group._id;
      if (g._id) return g._id;
    }
    return null;
  };

  const activeId = resolveActiveId();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalNotices, setTotalNotices] = useState(0);

  const isAdmin = user && ['admin', 'teacher', 'cr', 'class_rep'].includes(user.role);

  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const fetchNotices = async (reset = false) => {
    if (!activeId) {
        setLoading(false);
        return; 
    }
    if (reset) setLoading(true);
    setError('');
    try {
      const response = await api.get(`/notices/group/${activeId}`, {
        params: { page: reset ? 1 : page, limit: 20, pinned: filter === 'pinned' ? true : undefined }
      });
      if (response.data.success || response.data) {
        const fetchedNotices = response.data.notices || response.data || [];
        setTotalNotices(response.data.total || fetchedNotices.length || 0);
        if (reset) {
          setNotices(fetchedNotices);
          setPage(1);
        } else {
          setNotices(prev => [...prev, ...fetchedNotices]);
        }
        setHasMore(fetchedNotices.length === 20);
      }
    } catch (err) {
      if (err.response?.status === 404) {
         try {
           const fbRes = await api.get(`/notices/classroom/${activeId}`);
           setNotices(fbRes.data || []);
           setTotalNotices(fbRes.data?.length || 0);
         } catch (fallbackErr) {
           setError('Failed to fetch notices');
         }
      } else {
        setError(err.response?.data?.message || 'Failed to fetch notices');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeId) fetchNotices(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, filter]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchNotices();
    }
  };

  const handleCreateNotice = async (payload) => {
    try {
      const response = await api.post('/notices', payload);
      
      if (response.data) {
        const newNotice = response.data.notice || response.data;
        setNotices([newNotice, ...notices]);
        setShowCreateForm(false);
        setTotalNotices(prev => prev + 1);
        showSuccess('Notice posted successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit notice.');
    }
  };

  const handleUpdateNotice = async (noticeId, payload) => {
    try {
      const response = await api.put(`/notices/${noticeId}`, payload);

      if (response.data) {
        const updated = response.data.notice || response.data;
        setNotices(prev => prev.map(n => n._id === noticeId ? updated : n));
        setEditingNotice(null);
        setError('');
        showSuccess('Notice updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notice');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const response = await api.delete(`/notices/${noticeId}`);
      if (response.data.success || response.status === 200) {
        setNotices(prev => prev.filter(n => n._id !== noticeId));
        setTotalNotices(prev => prev - 1);
        showSuccess('Notice deleted successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  const handleMarkAsViewed = async (noticeId) => {
    try {
      await api.post(`/notices/${noticeId}/view`);
    } catch (err) {}
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  return (
    <div className="bg-slate-50/60 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-10 border border-white backdrop-blur-3xl relative overflow-hidden">
      
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-10 space-y-5 sm:space-y-0 z-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-indigo-600 mb-2 drop-shadow-sm">
            Notice Board
          </h2>
          <div className="flex items-center text-slate-500 font-medium">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="tracking-wide text-sm uppercase">{props.groupName || 'Group Updates'}</span>
            {totalNotices > 0 && (
              <span className="ml-4 px-3 py-1 bg-white shadow-sm text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                {totalNotices} Active
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={() => fetchNotices(true)} className="p-3.5 text-slate-400 bg-white hover:text-indigo-600 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1" title="Refresh">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          
          {isAdmin && (
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-500 hover:to-violet-500 shadow-[0_10px_20px_rgba(79,70,229,0.25)] transition-all duration-300 flex items-center space-x-2 transform hover:-translate-y-1">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span>{showCreateForm ? 'Cancel Creation' : 'Post New Notice'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 mb-8 flex space-x-2 p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl w-max overflow-x-auto border border-white/50 shadow-inner">
        {['all', 'pinned', 'urgent'].map((filterType) => (
          <button key={filterType} onClick={() => handleFilterChange(filterType)} className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide capitalize transition-all duration-300 ${ filter === filterType ? 'bg-white text-indigo-700 shadow-sm border border-slate-100 transform scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 scale-95 hover:scale-100' }`}>
            {filterType}
          </button>
        ))}
      </div>

      {successMsg && (
        <div className="mb-6 bg-emerald-50/90 backdrop-blur-md border border-emerald-200 p-4 rounded-2xl flex items-center shadow-lg shadow-emerald-500/10">
          <svg className="w-5 h-5 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <p className="text-emerald-700 font-bold">{successMsg}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-10">
          <CreateNotice onSubmit={handleCreateNotice} onCancel={() => setShowCreateForm(false)} groupId={activeId} />
        </div>
      )}

      {error && (
        <div className="mb-8 bg-red-50/90 backdrop-blur-md border border-red-200 p-5 rounded-2xl flex justify-between items-center shadow-lg shadow-red-500/10">
          <div className="flex items-center space-x-4 text-red-700 font-semibold">
            <p>{error}</p>
          </div>
          <button onClick={() => fetchNotices(true)} className="px-5 py-2.5 bg-white text-red-600 hover:bg-red-50 rounded-xl shadow-sm text-sm font-bold border border-red-100 transition-colors">Try Again</button>
        </div>
      )}

      <div className="relative z-10 space-y-6 min-h-[400px]">
        {loading && page === 1 ? (
  <div className="flex flex-col justify-center items-center py-24 min-h-[400px]">
    {/* Using your exact UniLifeLoader component */}
    <UniLifeLoader size="1" />
    
    <div className="mt-8 flex flex-col items-center">
      <p className="text-xs font-bold text-indigo-400 tracking-[0.3em] uppercase animate-pulse">
        Fetching Latest Notices
      </p>
      <div className="h-1.5 w-16 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mt-3 opacity-30"></div>
    </div>
  </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-24 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">It's quiet in here</h3>
            <p className="mt-3 text-slate-500 font-medium">No notices have been posted yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {notices.map((notice) => (
              <NoticeCard
                key={notice._id}
                notice={notice}
                isAdmin={isAdmin}
                onEdit={() => setEditingNotice(notice)}
                onDelete={() => handleDeleteNotice(notice._id)}
                onView={() => handleMarkAsViewed(notice._id)}
              />
            ))}
          </div>
        )}
      </div>

      {editingNotice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-900/30 max-h-[90vh] flex flex-col border border-white">
            <div className="flex justify-between items-center p-8 border-b border-slate-100">
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center">Edit Notice</h3>
              <button onClick={() => setEditingNotice(null)} className="text-slate-400 hover:text-rose-600 transition-colors bg-slate-50 hover:bg-rose-50 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <CreateNotice initialData={editingNotice} isEdit={true} onSubmit={(data) => handleUpdateNotice(editingNotice._id, data)} onCancel={() => setEditingNotice(null)} groupId={activeId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;