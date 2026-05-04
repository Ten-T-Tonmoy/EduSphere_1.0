import React, { useState, useEffect } from 'react';
import api from '../../utils/Api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserCheck, RefreshCw, Github, Linkedin, Camera, Award } from 'lucide-react';

const ContributorFormModal = ({ onClose, onSave, initialData }) => {
  // form state initialized with empty or existing data
  const [form, setForm] = useState({
    name: '', 
    role: '', 
    photo: '', 
    contributions: '', 
    github: '', 
    linkedin: ''
  });

  // Effect to populate form when editing an existing member
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        // Convert contributions array back to comma-separated string for editing
        contributions: Array.isArray(initialData.contributions) 
          ? initialData.contributions.join(', ') 
          : initialData.contributions || ''
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prepare payload by converting contributions string back to an array
    const payload = { 
      ...form, 
      contributions: typeof form.contributions === 'string' 
        ? form.contributions.split(',').map(s => s.trim()) 
        : form.contributions 
    };

    try {
      if (initialData?._id) {
        // Edit Mode: Update existing member
        await api.put(`/contributors/${initialData._id}`, payload);
      } else {
        // Add Mode: Create new member
        await api.post('/contributors', payload);
      }
      onSave(); // Refresh team list
      onClose(); // Close modal
    } catch (err) { 
      alert(err.response?.data?.message || "Synchronization error"); 
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 md:p-12 border border-slate-100 shadow-2xl relative overflow-hidden"
      >
        {/* Animated Background Decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />
        
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors z-10"><X size={24}/></button>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                {initialData ? <RefreshCw className="animate-spin-slow" /> : <UserCheck />}
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {initialData ? "Update Architect" : "Deploy Architect"}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Engineering Core Team</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1">
                    Full Name <span className="text-slate-300">•</span>
                </label>
                <input 
                  type="text" 
                  value={form.name}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm" 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="e.g. John Doe"
                  required 
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1">
                    Professional Role <span className="text-slate-300">•</span>
                </label>
                <input 
                  type="text" 
                  value={form.role}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm" 
                  onChange={e => setForm({...form, role: e.target.value})} 
                  placeholder="e.g. Lead Designer"
                  required 
                />
            </div>
          </div>
          
          <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1">
                  <Camera size={10}/> Photo URL (Cloudinary/Supabase)
              </label>
              <input 
                type="text" 
                value={form.photo}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm" 
                onChange={e => setForm({...form, photo: e.target.value})} 
                placeholder="https://..."
                required 
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1">
                    <Github size={10}/> GitHub Profile
                </label>
                <input 
                  type="text" 
                  value={form.github}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm" 
                  onChange={e => setForm({...form, github: e.target.value})} 
                  placeholder="github.com/..."
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1">
                    <Linkedin size={10}/> LinkedIn Profile
                </label>
                <input 
                  type="text" 
                  value={form.linkedin}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm" 
                  onChange={e => setForm({...form, linkedin: e.target.value})} 
                  placeholder="linkedin.com/in/..."
                />
            </div>
          </div>

          <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-indigo-600 ml-1 flex items-center gap-1">
                  <Award size={10}/> Key Contributions (comma separated)
              </label>
              <textarea 
                value={form.contributions}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm h-28 resize-none" 
                onChange={e => setForm({...form, contributions: e.target.value})} 
                placeholder="UI Design, Backend API, Attendance Logic..."
                required 
              />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group mt-4"
          >
            {initialData ? (
                <>
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    UPDATE ARCHITECT DATA
                </>
            ) : (
                <>
                    <Send size={18} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                    CONFIRM SQUAD DEPLOYMENT
                </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ContributorFormModal;