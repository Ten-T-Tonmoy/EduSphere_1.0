import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import UniLifeLoader from "../components/Loader/UniLifeLoader";
import { 
  User, Mail, Building2, ShieldCheck, Calendar, 
  BookOpen, Edit3, Save, X, AlertCircle, Clock, 
  CheckCircle2, Users, Fingerprint
} from "lucide-react";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  
  // ✅ NEW: Avatar Upload States
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null); 

  // Restored exact original payload structure so backend validation passes
  const [formData, setFormData] = useState({
    name: user?.name || "",
    department: user?.department || "",
    studentId: user?.studentId || "",
    employeeId: user?.employeeId || "",
    year: user?.year || "",
    semester: user?.semester || ""
  });

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // State to hold populated group names
  const [fetchedGroups, setFetchedGroups] = useState([]);

  // Lock Logic States
  const [isLocked, setIsLocked] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  // Fetch Actual Group Names on Mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups/my-groups");
        const names = res.data.groups?.map(item => item.group?.name).filter(Boolean) || [];
        setFetchedGroups(names);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };
    fetchGroups();
  }, []);

  // Check Edit Lock Status on Mount
  useEffect(() => {
    if (user?._id) {
      const lockData = localStorage.getItem(`profile_lock_${user._id}`);
      if (lockData) {
        const lockDate = new Date(lockData);
        const now = new Date();
        const diffTime = Math.abs(now - lockDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          setIsLocked(true);
          setDaysRemaining(30 - diffDays);
        } else {
          localStorage.removeItem(`profile_lock_${user._id}`);
          setIsLocked(false);
        }
      }
    }
  }, [user?._id]);

  // Handle Save & Lock Profile
  const handleSave = async () => {
    setLoading(true);
    try {
      // Sends the exact payload format the backend expects (with numerical year/sem)
      const res = await api.put("/auth/profile", formData);
      
      if (updateUser && res.data) {
         updateUser(res.data);
      }
      
      localStorage.setItem(`profile_lock_${user._id}`, new Date().toISOString());
      setIsLocked(true);
      setDaysRemaining(30);
      setIsEditing(false);
      
      setSuccessMsg("Profile updated successfully! Locked for 30 days.");
      setTimeout(() => setSuccessMsg(""), 4000);
      
    } catch (err) {
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  // ✅ NEW: Handle Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Frontend Validation
    if (file.size > 1024 * 1024) {
      return alert("File is too large! Maximum size is 1MB.");
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return alert("Only JPG and PNG images are allowed.");
    }

    const uploadFormData = new FormData();
    uploadFormData.append('avatar', file);

    try {
      setUploading(true);
      const res = await api.put('/users/profile/avatar', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        // Quickest and safest way to globally update context without breaking existing state
        window.location.reload(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      
      {/* 1. PREMIUM HEADER BANNER */}
      <div className="h-64 bg-slate-900 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-50/50 to-transparent"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 space-y-6">
        
        {/* Success Toast */}
        {successMsg && (
          <div className="absolute -top-16 left-0 right-0 flex justify-center animate-in slide-in-from-top-4 fade-in duration-300 z-50">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              {successMsg}
            </div>
          </div>
        )}

        {/* 2. MAIN PROFILE CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          
          {/* ✅ NEW: Interactive Avatar Upload Component */}
          <div 
            className="w-32 h-32 rounded-full bg-indigo-100 border-4 border-white shadow-lg flex items-center justify-center shrink-0 relative overflow-hidden group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-extrabold text-indigo-700">{getInitials(user?.name)}</span>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-white text-xs font-bold tracking-wide">
                 {uploading ? "UPLOADING..." : "CHANGE"}
               </span>
            </div>

            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleAvatarUpload} 
            />
          </div>
          
          <div className="flex-1 mb-2">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user?.name}</h1>
              {user?.role === 'class_rep' && (
                <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> CR
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{user?.role?.replace("_", " ")}</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {isEditing ? (
              <>
                <button onClick={() => {setIsEditing(false); setFormData({...formData, name: user?.name, year: user?.year, semester: user?.semester});}} className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={loading || !formData.name.trim()} className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <UniLifeLoader size="sm" /> : <Save className="w-4 h-4" />} 
                  Save Changes
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                disabled={isLocked}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {isLocked ? <Clock className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isLocked ? 'Locked' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        {/* 3. LOCK WARNING BANNER */}
        {isLocked && !isEditing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-sm animate-in fade-in duration-500">
            <div className="bg-amber-100 p-2 rounded-full shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Profile Edit Locked</h3>
              <p className="text-xs font-medium text-amber-700 mt-0.5">
                To maintain record integrity, personal details can only be changed once a month. You can edit your profile again in <strong className="text-amber-900">{daysRemaining} days</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* 4. ACADEMIC IDENTITY (Strictly Read-Only) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Academic Identity</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified • Read Only</p>
              </div>
            </div>

            <div className="space-y-5 flex-1">
              {/* Student/Employee ID */}
              <div>
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Fingerprint className="w-3.5 h-3.5"/> {user?.role === 'teacher' ? 'Employee ID' : 'Student ID'}</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                    {user?.role === 'teacher' ? (user?.employeeId || "N/A") : (user?.studentId || "N/A")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Mail className="w-3.5 h-3.5"/> University Email</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="font-semibold text-slate-900 text-sm">{user?.email || "No email linked"}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Building2 className="w-3.5 h-3.5"/> Department</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="font-semibold text-slate-900 text-sm">{user?.department || "Unassigned"}</p>
                </div>
              </div>

              {/* Group Names (Fetched dynamically) */}
              <div>
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-1.5"><Users className="w-3.5 h-3.5"/> Assigned Groups</label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex flex-wrap gap-2">
                  {fetchedGroups.length === 0 ? (
                    <span className="text-sm font-semibold text-slate-400">Not assigned to any groups</span>
                  ) : (
                    fetchedGroups.map((groupName, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                        {groupName}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. PERSONAL DETAILS (Editable Once a Month) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <User className="w-6 h-6 text-indigo-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Personal Details</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">General Information</p>
              </div>
            </div>

            <div className="space-y-5 flex-1">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all shadow-sm"
                  />
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="font-bold text-slate-900 text-sm">{user?.name}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Academic Year</label>
                {isEditing ? (
                  <select 
                    value={formData.year} 
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="font-bold text-slate-900 text-sm">{user?.year ? `Year ${user.year}` : "-"}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Semester</label>
                {isEditing ? (
                  <select 
                    value={formData.semester} 
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                    <p className="font-bold text-slate-900 text-sm">{user?.semester ? `Sem ${user.semester}` : "-"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Hint Box */}
            {!isEditing && !isLocked && (
              <div className="mt-6 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                <p className="text-xs font-semibold text-slate-500">
                  You are eligible to update these details today. Remember, saving changes will lock them for <span className="text-slate-800">30 days</span>.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;