import React, { useState } from 'react';
import { useParams } from 'react-router-dom'; 
import { useAuth } from '../../context/Authcontext'; 
import './CreateNotice.css';

const CreateNotice = ({ onSubmit, onCancel, initialData = null, isEdit = false, groupId }) => {
  const { user } = useAuth();
  const params = useParams();

  const resolveGroupId = () => {
    if (groupId) return groupId;
    if (params.classroomId) return params.classroomId;
    if (params.groupId) return params.groupId;
    if (params.id) return params.id;
    if (initialData?.classroom) return initialData.classroom;
    if (initialData?.groupId) return initialData.groupId;
    
    if (user?.groups && user.groups.length > 0) {
      const g = user.groups[0];
      if (typeof g === 'string') return g;
      if (g.group && typeof g.group === 'string') return g.group;
      if (g.group && g.group._id) return g.group._id;
      if (g._id) return g._id;
    }
    return null;
  };

  const finalGroupId = resolveGroupId();
  const resolvedUserId = user?._id || user?.id;

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    priority: (initialData?.priority === 'medium' ? 'normal' : initialData?.priority) || 'normal',
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : '',
    attachments: initialData?.attachments || [] 
  });
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const invalid = files.some(f => f.size > 10 * 1024 * 1024);
    if (invalid) {
      setError('Each file must be less than 10MB');
      return;
    }
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    setError('');

    const hasPhysicalFiles = formData.attachments.some(file => file instanceof File);

    let payload;

    if (hasPhysicalFiles) {
      payload = new FormData();
      payload.append('title', formData.title);
      payload.append('content', formData.content);
      payload.append('priority', formData.priority);
      if (formData.expiresAt) payload.append('expiresAt', formData.expiresAt);
      
      if (finalGroupId) {
        payload.append('classroom', finalGroupId);
        payload.append('groupId', finalGroupId);
      }
      if (resolvedUserId) {
        payload.append('postedBy', resolvedUserId);
        payload.append('createdBy', resolvedUserId);
      }

      formData.attachments.forEach(file => {
        if (file instanceof File) {
          payload.append('attachments', file);
        }
      });
    } else {
      payload = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expiresAt: formData.expiresAt || undefined,
      };
      
      if (finalGroupId) {
        payload.classroom = finalGroupId;
        payload.groupId = finalGroupId;
      }
      if (resolvedUserId) {
        payload.postedBy = resolvedUserId;
        payload.createdBy = resolvedUserId;
      }
    }

    try {
      await onSubmit(payload); 
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err.message || 'Failed to submit notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl flex items-center space-x-3">
          <svg className="w-5 h-5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6 relative group">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          maxLength="100"
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-900 text-lg placeholder-slate-400"
          placeholder="E.g., Tomorrow's class is cancelled..."
          disabled={submitting}
        />
      </div>

      <div className="mb-6 relative group">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Content Message *</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          rows="5"
          maxLength="5000"
          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 leading-relaxed placeholder-slate-400 custom-textarea-scroll"
          placeholder="Write the full details here..."
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority Level</label>
          <div className="relative">
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full appearance-none px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700 cursor-pointer"
            >
              <option value="low">📉 Low Priority</option>
              <option value="normal">🗓️ Normal Priority</option>
              <option value="high">⚠️ High Priority</option>
              <option value="urgent">🚨 Urgent Notice</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Auto-Delete On (Optional)</label>
          <input
            type="date"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700 cursor-text"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="mb-10">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">File Attachments</label>
        
        <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl transition-all duration-300 group">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            disabled={submitting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <p className="text-sm font-bold text-slate-700">Click to upload files or drag and drop</p>
            <p className="text-xs font-medium text-slate-400 mt-1">PDF, DOC, Images (Max 10MB each)</p>
          </div>
        </div>

        {formData.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.attachments.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="text-2xl">📎</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-slate-700 truncate">{file.name || file.fileName || file.originalName}</span>
                    {file.size && (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => removeAttachment(idx)} className="p-2 ml-2 text-slate-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors" disabled={submitting}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-6 py-3.5 text-slate-500 font-bold bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all" disabled={submitting}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all flex items-center space-x-2 transform hover:-translate-y-0.5">
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{isEdit ? 'Updating...' : 'Publishing...'}</span>
            </>
          ) : (
            <span>{isEdit ? 'Save Changes' : 'Publish Notice'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateNotice;