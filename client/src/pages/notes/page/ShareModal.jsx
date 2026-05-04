import React, { useState, useEffect } from 'react';
import api from '../../../utils/Api';
import { Share2, MessageSquare, Clock, PlusCircle, X, BookOpen, Paperclip, Send } from 'lucide-react';
import UniLifeLoader from '../../../components/Loader/UniLifeLoader';


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
      const extractedGroups = groupsRes.data.groups?.map(item => item.group).filter(Boolean) || [];
      setMyGroups(extractedGroups);
      setSharedNotes(sharedRes.data || []);
      setNoteRequests(reqsRes.data || []);
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
      // FIX: Extract the specific 'all' array from your groupController's response object
      setGroupMembers(res.data?.members?.all || []);
    } catch {
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Banner */}
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
        <div className="flex flex-col justify-center items-center py-24 min-h-[500px] bg-white rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
    {/* Subtle background glow to match the blue theme */}
    <div className="absolute inset-0 bg-blue-50/30 pointer-events-none" />
    
    <div className="relative z-10 flex flex-col items-center">
      {/* Your exact UniLifeLoader component */}
      <UniLifeLoader size="1.2" />
      
      <div className="mt-12 flex flex-col items-center">
        <p className="text-xs font-black text-blue-600 tracking-[0.3em] uppercase animate-pulse">
          Synchronizing Workspace
        </p>
        {/* Decorative bar matching the Share2 icon color */}
        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-3 opacity-40"></div>
        <p className="text-[10px] text-slate-400 font-bold mt-4 max-w-[280px] text-center leading-relaxed">
          Fetching group materials, member directories, and active requests...
        </p>
      </div>
    </div>
  </div>
  ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left: Requests */}
           <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-4 border-b border-gray-100"><MessageSquare className="w-5 h-5 text-indigo-500"/> Material Requests</h4>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[600px] custom-scrollbar">
                 {noteRequests.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <p className="text-sm text-gray-400">No active requests.</p>
                    </div>
                 ) : (
                    noteRequests.map((req) => (
                       <div key={req._id} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                          <p className="text-sm font-medium text-gray-800 mb-3">{req.description}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                             <span>From: <span className="font-semibold text-gray-700">{req.requester?.name || "A Classmate"}</span></span>
                             <button onClick={() => setShowShareModal(true)} className="text-indigo-600 hover:text-indigo-800 font-semibold underline">Fulfill</button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Right: Shared Materials */}
           <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-4 border-b border-gray-100"><BookOpen className="w-5 h-5 text-green-500"/> Shared With You</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {sharedNotes.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                       <p className="text-gray-500 font-medium">No materials shared with you yet.</p>
                    </div>
                 ) : (
                    sharedNotes.map((note) => (
                       <div key={note._id} className="bg-white border border-gray-200 p-5 rounded-2xl hover:shadow-md flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                   {(note.sharedBy?.name || "U")[0]}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-gray-900">{note.sharedBy?.name || "Unknown"}</p>
                                   <p className="text-[10px] text-gray-400">{note.group?.name || "Group"}</p>
                                </div>
                             </div>
                          </div>
                          <p className="text-sm text-gray-700 font-medium flex-1 mb-4">"{note.description}"</p>
                          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                             <span className="text-xs text-gray-500 flex items-center gap-1"><Paperclip className="w-3 h-3"/> {note.attachments?.length || 0} Files</span>
                             <button onClick={() => window.open(note.attachments[0]?.url, '_blank')} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">View Material</button>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Share Modal */}
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
                     {myGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
               </div>
               {shareForm.groupId && (
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Share With (Optional)</label>
                    <select value={shareForm.targetUserId} onChange={(e) => setShareForm({...shareForm, targetUserId: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm">
                       <option value="all">All Group Members</option>
                       {groupMembers.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
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

      {/* Request Modal */}
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
                     {myGroups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                  </select>
               </div>
               {requestForm.groupId && (
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Request From (Optional)</label>
                    <select value={requestForm.targetUserId} onChange={(e) => setRequestForm({...requestForm, targetUserId: e.target.value})} className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm">
                       <option value="all">All Group Members</option>
                       {groupMembers.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
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