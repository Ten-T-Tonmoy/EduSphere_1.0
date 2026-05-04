import React, { useState, useEffect } from 'react';
import api from '../../../utils/Api';
import NoteForm from './NoteForm.jsx';
import { Star, Eye, Paperclip, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../context/Authcontext';
import UniLifeLoader from '../../../components/Loader/UniLifeLoader.jsx';


const ImportantMaterialsTab = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

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

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/my-groups');
      const groupsData = res.data.groups || [];
      setMyGroups(groupsData);
      if (groupsData.length > 0) {
        handleGroupSelect(groupsData[0]);
      }
    } catch (err) {
      console.error("Failed to load groups");
    }
  };

  const handleGroupSelect = async (groupObj) => {
    setSelectedGroup(groupObj);
    setLoading(true);
    try {
      const res = await api.get(`/important-materials/group/${groupObj.group._id}`);
      setMaterials(res.data);
    } catch (err) {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async (noteData) => {
    try {
      const formData = new FormData();
      formData.append('groupId', selectedGroup.group._id);
      formData.append('content', noteData.content);
      noteData.attachments.forEach(file => formData.append('attachments', file));

      const res = await api.post('/important-materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMaterials([res.data, ...materials]);
      alert("Material posted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post material.");
    }
  };

  const handleViewMaterial = async (matId) => {
    try {
      await api.post(`/important-materials/${matId}/view`);
      setMaterials(prev => prev.map(m => {
        if (m._id === matId && !m.viewedBy.includes(user._id)) {
          return { ...m, viewedBy: [...m.viewedBy, user._id] };
        }
        return m;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (matId) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await api.delete(`/important-materials/${matId}`);
      setMaterials(materials.filter(m => m._id !== matId));
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const canPost = selectedGroup && ['teacher', 'class_rep', 'admin'].includes(selectedGroup.role);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
        <div>
           <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="w-6 h-6 text-amber-500"/> Important Class Materials</h3>
           <p className="text-gray-500 text-sm mt-1">Curated highly-important resources from your Teachers and CRs.</p>
        </div>
        <div className="w-full md:w-64">
           <select 
             className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-gray-700 outline-none"
             onChange={(e) => {
                const g = myGroups.find(x => x.group._id === e.target.value);
                if(g) handleGroupSelect(g);
             }}
             value={selectedGroup?.group?._id || ''}
           >
              {myGroups.map((g, i) => (
                 <option key={i} value={g.group._id}>{g.group.name}</option>
              ))}
           </select>
        </div>
      </div>

      {canPost && (
        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 shadow-sm">
           <h4 className="text-amber-800 font-bold mb-4">Post New Important Material</h4>
           <NoteForm onSubmit={handleCreateMaterial} />
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
           <div className="flex flex-col justify-center items-center py-24 min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm">
    <UniLifeLoader size="1" />
    <div className="mt-8 flex flex-col items-center">
      <p className="text-xs font-bold text-amber-500 tracking-[0.3em] uppercase animate-pulse">
        Fetching High-Priority Resources
      </p>
      {/* Decorative amber bar to match the Star theme */}
      <div className="h-1 w-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mt-3 opacity-40"></div>
      <p className="text-[10px] text-gray-400 font-medium mt-4 max-w-[200px] text-center leading-relaxed">
        Syncing with your group's latest curated materials...
      </p>
    </div>
  </div>
        ) : materials.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
              <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No important materials posted for this group yet.</p>
           </div>
        ) : (
           materials.map(mat => {
              const hasViewed = mat.viewedBy.includes(user._id);
              return (
                 <div key={mat._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                             {mat.sharedBy.name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-gray-900">{mat.sharedBy.name} <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase ml-1">{mat.sharedBy.role === 'class_rep' ? 'CR' : mat.sharedBy.role}</span></p>
                             {/* ADDED DYNAMIC TIME HERE */}
                             <p className="text-xs font-semibold text-gray-500">{formatDate(mat.createdAt)}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm" title="Total Views">
                             <Eye className="w-4 h-4" /> <span className="text-sm font-bold">{mat.viewedBy.length}</span>
                          </div>
                          {(mat.sharedBy._id === user._id || user.role === 'admin') && (
                             <button onClick={() => handleDelete(mat._id)} className="text-red-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-5 h-5"/>
                             </button>
                          )}
                       </div>
                    </div>

                    <div className="p-6 prose prose-indigo max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: mat.content }} />

                    <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center border-t border-gray-100">
                       <div className="flex flex-wrap gap-2">
                          {mat.attachments.map((file, i) => (
                             <a 
                               key={i} href={file.url} target="_blank" rel="noreferrer"
                               onClick={() => handleViewMaterial(mat._id)}
                               className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                             >
                                <Paperclip className="w-3.5 h-3.5" /> {file.originalName}
                             </a>
                          ))}
                       </div>
                       
                       {!hasViewed ? (
                          <button onClick={() => handleViewMaterial(mat._id)} className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                             <Eye className="w-4 h-4"/> Mark as read
                          </button>
                       ) : (
                          <span className="text-sm font-bold text-green-500 flex items-center gap-1">
                             <CheckCircle className="w-4 h-4"/> Read
                          </span>
                       )}
                    </div>
                 </div>
              );
           })
        )}
      </div>
    </div>
  );
};

export default ImportantMaterialsTab;