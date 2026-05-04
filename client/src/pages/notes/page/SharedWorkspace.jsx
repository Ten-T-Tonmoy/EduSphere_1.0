import React, { useState, useEffect } from 'react';
import api from '../../../utils/Api';
import { Share2, MessageSquare, Clock, PlusCircle, X, BookOpen, Paperclip, Send, Eye } from 'lucide-react';
import UniLifeLoader from '../../../components/Loader/UniLifeLoader';



// --- NEW: Relative Time Formatter ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTargetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.floor((startOfToday - startOfTargetDate) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    const diffMs = now - date;
    if (diffMs < 60000) return 'Just now';
    return `Today at ${timeStr}`;
  }
  if (dayDiff === 1) return `Yesterday at ${timeStr}`;
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago at ${timeStr}`;
  if (dayDiff >= 7 && dayDiff < 30) {
    const weeks = Math.floor(dayDiff / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago at ${timeStr}`;
  }
  if (dayDiff >= 30 && dayDiff < 365) {
    const months = Math.floor(dayDiff / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(dayDiff / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const SharedWorkspace = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [noteRequests, setNoteRequests] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [shareForm, setShareForm] = useState({ groupId: '', targetUserId: 'all', description: '', files: [] });
  const [requestForm, setRequestForm] = useState({ groupId: '', targetUserId: 'all', description: '' });

  useEffect(() => {
    fetchSharedWorkspaceData();
  }, []);

  const fetchSharedWorkspaceData = async () => {
    setLoadingShared(true);
    try {
      const [groupsRes, sharedRes, reqsRes] = await Promise.all([
         api.get('/groups/my-groups').catch(() => ({ data: { groups: [] } })),
         api.get('/notes/shared').catch(() => ({ data: [] })), 
         api.get('/notes/requests').catch(() => ({ data: [] }))
      ]);
      const extractedGroups = groupsRes.data?.groups?.map(item => item.group).filter(Boolean) || [];
      setMyGroups(Array.isArray(extractedGroups) ? extractedGroups : []);
      setSharedNotes(Array.isArray(sharedRes.data) ? sharedRes.data : []);
      setNoteRequests(Array.isArray(reqsRes.data) ? reqsRes.data : []);
    } catch (err) {
      console.error("Error loading shared data", err);
    } finally {
      setLoadingShared(false);
    }
  };

  const handleGroupChange = async (groupId, formSetter) => {
    formSetter(prev => ({ ...prev, groupId, targetUserId: 'all' }));
    if (!groupId) return setGroupMembers([]);
    try {
      const res = await api.get(`/groups/${groupId}/members`);
      let membersArray = [];
      if (res.data?.members?.all && Array.isArray(res.data.members.all)) membersArray = res.data.members.all;
      else if (res.data?.members && Array.isArray(res.data.members)) membersArray = res.data.members;
      else if (Array.isArray(res.data)) membersArray = res.data;
      setGroupMembers(membersArray);
    } catch (err) {
      setGroupMembers([]);
    }
  };

  const submitShareMaterial = async (e) => {
    e.preventDefault();
    if (!shareForm.groupId || !shareForm.description) return alert("Group and description are required.");
    try {
      const formData = new FormData();
      formData.append('groupId', shareForm.groupId);
      formData.append('targetUserId', shareForm.targetUserId);
      formData.append('description', shareForm.description);
      Array.from(shareForm.files).forEach(file => formData.append('attachments', file));

      const res = await api.post('/notes/share', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSharedNotes([res.data, ...sharedNotes]); 
      setShowShareModal(false);
      setShareForm({ groupId: '', targetUserId: 'all', description: '', files: [] });
      alert("Material shared successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to share material.");
    }
  };

  const submitRequestMaterial = async (e) => {
    e.preventDefault();
    if (!requestForm.groupId || !requestForm.description) return alert("Group and description are required.");
    try {
      const res = await api.post('/notes/requests', {
        groupId: requestForm.groupId, targetUserId: requestForm.targetUserId, description: requestForm.description
      });
      setNoteRequests([res.data, ...noteRequests]); 
      setShowRequestModal(false);
      setRequestForm({ groupId: '', targetUserId: 'all', description: '' });
      alert("Request sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request.");
    }
  };

  const handleViewMaterial = async (note) => {
    if (note.attachments?.length > 0) window.open(note.attachments[0].url, '_blank');
    try {
      await api.post(`/notes/shared/${note._id}/view`);
      setSharedNotes(prev => prev.map(n => {
        if (n._id === note._id) return { ...n, viewedBy: [...(n.viewedBy || []), 'dummy'] };
        return n;
      }));
      fetchSharedWorkspaceData(); 
    } catch (err) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
           <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Share2 className="w-6 h-6 text-blue-600"/> Shared Workspace</h3>
           <p className="text-gray-500 text-sm mt-1">Share PDFs/Images with your group or request what you need.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
           <button onClick={() => setShowRequestModal(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 rounded-xl font-semibold shadow-sm">
              <Clock className="w-4 h-4" /> Request Material
           </button>
           <button onClick={() => setShowShareModal(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-semibold shadow-sm">
              <PlusCircle className="w-4 h-4" /> Share Material
           </button>
        </div>
      </div>

      {loadingShared ? (
  /* Branded Loading UI for Shared Workspace */
  <div className="flex flex-col justify-center items-center py-24 min-h-[500px] bg-white/50 backdrop-blur-sm rounded-[2rem] border border-gray-100 shadow-sm">
    <UniLifeLoader size="1.2" />
    <div className="mt-10 flex flex-col items-center">
      <p className="text-xs font-black text-blue-600 tracking-[0.3em] uppercase animate-pulse">
        Synchronizing Workspace
      </p>
      {/* Decorative accent matching the blue theme */}
      <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-3 opacity-40"></div>
      <p className="text-[10px] text-gray-400 font-bold mt-4 max-w-[250px] text-center leading-relaxed">
        Fetching your group's shared files and active material requests...
      </p>
    </div>
  </div>
  ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-4 border-b border-gray-100"><MessageSquare className="w-5 h-5 text-indigo-500"/> Material Requests</h4>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[600px] custom-scrollbar">
                 {(!Array.isArray(noteRequests) || noteRequests.length === 0) ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <p className="text-sm text-gray-400">No active requests.</p>
                    </div>
                 ) : (
                    noteRequests.map((req) => (
                       <div key={req._id} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                          <div className="flex justify-between items-start mb-1 gap-2">
                             <p className="text-sm font-medium text-gray-800 mb-2">{req.description}</p>
                             <div className="flex flex-col items-end gap-1 shrink-0">
                               {req.targetUser && <span className="bg-purple-200 text-purple-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">PRIVATE</span>}
                               {/* ADDED DYNAMIC TIME HERE */}
                               <span className="text-[10px] text-indigo-400 font-bold whitespace-nowrap">{formatDate(req.createdAt)}</span>
                             </div>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                             <span>From: <span className="font-semibold text-gray-700">{req.requester?.name || "A Classmate"}</span></span>
                             <button onClick={() => setShowShareModal(true)} className="text-indigo-600 hover:text-indigo-800 font-semibold underline">Fulfill</button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-4 border-b border-gray-100"><BookOpen className="w-5 h-5 text-green-500"/> Shared With You</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {(!Array.isArray(sharedNotes) || sharedNotes.length === 0) ? (
                    <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                       <p className="text-gray-500 font-medium">No materials shared with you yet.</p>
                    </div>
                 ) : (
                    sharedNotes.map((note) => (
                       <div key={note._id} className="bg-white border border-gray-200 p-5 rounded-2xl hover:shadow-md flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                   {(note.sharedBy?.name || "U")[0]}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                     {note.sharedBy?.name || "Unknown"}
                                     {note.targetUser && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">Private</span>}
                                   </p>
                                   {/* ADDED DYNAMIC TIME HERE */}
                                   <p className="text-[10px] text-gray-400">{note.group?.name || "Group"} • <span className="font-medium text-gray-500">{formatDate(note.createdAt)}</span></p>
                                </div>
                             </div>
                          </div>
                          <p className="text-sm text-gray-700 font-medium flex-1 mb-4">"{note.description}"</p>
                          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 flex items-center gap-1"><Paperclip className="w-3 h-3"/> {note.attachments?.length || 0} Files</span>
                                {!note.targetUser && (
                                   <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1" title="Views">
                                      <Eye className="w-3.5 h-3.5" /> {note.viewedBy?.length || 0}
                                   </span>
                                )}
                             </div>
                             {note.attachments?.length > 0 && (
                                <button onClick={() => handleViewMaterial(note)} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">View Material</button>
                             )}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
               <h3 className="text-white font-bold text-lg">Share PDF/JPG/PNG</h3>
               <button onClick={() => setShowShareModal(false)} className="text-indigo-200 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={submitShareMaterial} className="p-6 space-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Group *</label>
                  <select required value={shareForm.groupId} onChange={(e) => handleGroupChange(e.target.value, setShareForm)} className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm">
                     <option value="">-- Choose a Group --</option>
                     {Array.isArray(myGroups) && myGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
               </div>
               {shareForm.groupId && (
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Share With (Optional)</label>
                    <select value={shareForm.targetUserId} onChange={(e) => setShareForm({...shareForm, targetUserId: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm">
                       <option value="all">All Group Members</option>
                       {Array.isArray(groupMembers) && groupMembers.map(m => (
                         <option key={m.user?._id || Math.random()} value={m.user?._id}>{m.user?.name || "Unknown Member"}</option>
                       ))}
                    </select>
                 </div>
               )}
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                  <textarea required value={shareForm.description} onChange={(e) => setShareForm({...shareForm, description: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm resize-none"></textarea>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Attach Files (PDF, JPG, PNG)</label>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setShareForm({...shareForm, files: e.target.files})} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer"/>
               </div>
               <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowShareModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Share Now</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
               <h3 className="text-white font-bold text-lg">Request Material</h3>
               <button onClick={() => setShowRequestModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={submitRequestMaterial} className="p-6 space-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Group *</label>
                  <select required value={requestForm.groupId} onChange={(e) => handleGroupChange(e.target.value, setRequestForm)} className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm">
                     <option value="">-- Choose a Group --</option>
                     {Array.isArray(myGroups) && myGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
               </div>
               {requestForm.groupId && (
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Request From (Optional)</label>
                    <select value={requestForm.targetUserId} onChange={(e) => setRequestForm({...requestForm, targetUserId: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm">
                       <option value="all">All Group Members</option>
                       {Array.isArray(groupMembers) && groupMembers.map(m => (
                          <option key={m.user?._id || Math.random()} value={m.user?._id}>{m.user?.name || "Unknown Member"}</option>
                       ))}
                    </select>
                 </div>
               )}
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">What do you need? *</label>
                  <textarea required value={requestForm.description} onChange={(e) => setRequestForm({...requestForm, description: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm resize-none"></textarea>
               </div>
               <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="px-5 py-2.5 text-gray-600 font-semibold">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2"><Send className="w-4 h-4"/> Send Request</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedWorkspace;