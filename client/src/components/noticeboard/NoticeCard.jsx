import React, { useState } from 'react';
import { useAuth } from '../../context/Authcontext'; // FIXED: Lowercase 'c' for your project
import './NoticeCard.css';
import UniLifeLoader from '../Loader/UniLifeLoader';

const NoticeCard = ({ notice, isAdmin, onEdit, onDelete, onView }) => {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();

  const canManage = isAdmin || notice.createdBy?._id === user?._id || notice.postedBy?._id === user?._id;
  const hasViewed = notice.views?.some(v => v.user?._id === user?._id || v.user === user?._id);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType === 'text/plain') return '📃';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400/50';
      case 'high': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/50';
      case 'medium': return 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30';
      default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
    }
  };

  const handleDownload = async (fileId, fileUrl, filename) => {
    if (fileUrl && fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
      return;
    }
    
    setDownloading(true);
    try {
      // FIXED: Used import.meta.env for Vite compatibility to prevent 'process is not defined' crash
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/notices/file/${fileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleView = (fileId, fileUrl) => {
    if (fileUrl && fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    } else {
      // FIXED: Used import.meta.env for Vite compatibility
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      window.open(`${API_URL}/notices/file/${fileId}?token=${localStorage.getItem('token')}`, '_blank');
    }
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
    if (!expanded && !hasViewed && onView) {
      onView();
    }
  };

  return (
    <div className={`group relative bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 border ${notice.isPinned || notice.pinned ? 'border-amber-300 shadow-amber-500/10' : 'border-slate-100'}`}>
      
      {(notice.isPinned || notice.pinned) && (
        <div className="absolute -top-3 -right-3 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full shadow-lg shadow-amber-500/40 border-[3px] border-white transform rotate-12 z-10">
          <span className="text-white text-lg">📌</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-200 flex items-center justify-center border border-indigo-200 shadow-inner">
            <span className="text-indigo-700 font-extrabold text-xl">
              {(notice.createdBy?.name || notice.postedBy?.name || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{notice.createdBy?.name || notice.postedBy?.name || 'Unknown Author'}</p>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
              <span>{formatDate(notice.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest ${getPriorityStyle(notice.priority)}`}>
          {notice.priority || 'Normal'}
        </div>
      </div>

      <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
        {notice.title}
      </h3>

      {notice.attachments && notice.attachments.length > 0 && (
        <div className="mb-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Attachments ({notice.attachments.length})</h4>
          <div className="flex flex-wrap gap-3">
            {notice.attachments.map((file, index) => {
              const fName = file.fileName || file.originalName || file.filename || 'Attached File';
              const fSize = formatFileSize(file.fileSize || file.size);
              const fType = file.fileType || file.mimeType;

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-300 group/file w-full sm:w-auto flex-1 min-w-[250px]">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-2xl bg-slate-50 p-2 rounded-lg">{getFileIcon(fType)}</span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-slate-700 truncate">{fName}</span>
                      <span className="text-xs font-semibold text-slate-400">{fSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pl-4">
                    <button onClick={() => handleView(file.fileId, file.fileUrl)} disabled={downloading} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors font-medium text-sm" title="View">
                      👁️
                    </button>
                    <button onClick={() => handleDownload(file.fileId, file.fileUrl, fName)} disabled={downloading} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors font-medium text-sm" title="Download">
                      {downloading ? '⏳' : '📥'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative mb-2">
        <button
          onClick={handleToggleExpand}
          className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all duration-300 border ${
            expanded 
              ? 'bg-slate-100 border-slate-200 text-slate-600' 
              : 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm hover:shadow-md hover:bg-indigo-100 hover:-translate-y-0.5'
          }`}
        >
          <span className="text-sm tracking-wide">{expanded ? 'Close Notice Message' : 'Read Full Notice Message'}</span>
          <svg className={`w-5 h-5 transform transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`notice-content-wrapper ${expanded ? 'expanded' : ''}`}>
        <div className="notice-content-inner p-6 md:p-8 mt-4 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-inner">
          <p className="text-slate-700 text-[15px] md:text-base leading-relaxed font-medium whitespace-pre-wrap">
            {notice.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-xs font-bold tracking-wide text-slate-400 uppercase">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span>{notice.views?.length || 0} Views</span>
          </span>
          {notice.expiresAt && (
            <span className="flex items-center space-x-1.5 text-xs font-bold tracking-wide text-rose-400 uppercase">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Expires {new Date(notice.expiresAt).toLocaleDateString()}</span>
            </span>
          )}
        </div>

        {canManage && (
          <div className="flex space-x-2">
            <button onClick={() => onEdit(notice)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={() => onDelete(notice._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default NoticeCard;