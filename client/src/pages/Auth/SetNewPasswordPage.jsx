// src/pages/Auth/SetNewPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../utils/Api';
import UniLifeLoader from '../../components/Loader/UniLifeLoader';

const SetNewPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Link expired or invalid.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] opacity-60" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative z-10 border border-slate-100 text-center">
        {!success ? (
          <>
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100 text-white">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Set New Password</h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">Please enter your new secure password.</p>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-left">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">New Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" required minLength={6}
                    className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-medium" 
                    placeholder="••••••••" 
                    value={password} onChange={e => setPassword(e.target.value)} 
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <UniLifeLoader size="0.4" />
                    <span className="tracking-widest uppercase text-[10px] font-black">
                      Updating...
                    </span>
                  </div>
                ) : (
                  <>
                    Update Password <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="py-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Password Updated!</h2>
            <p className="text-slate-500 font-medium">Your credentials have been synced. Redirecting to login...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SetNewPasswordPage;