// src/pages/Auth/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Send, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';


const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    // Your logic for password reset API call
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-indigo-50 rounded-full blur-[120px] opacity-40" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative z-10 border border-slate-100"
      >
        <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-600 mb-8 transition-colors">
          <ChevronLeft size={14} /> Back to Login
        </Link>

        <div className="mb-10">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recover Access</h1>
          <p className="text-slate-500 font-medium text-sm mt-2">We'll send you a secure link to reset your password.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" required
                  className="w-full bg-slate-50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-medium"
                  placeholder="name@varsity.ac.bd"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
              Send Reset Link <Send size={18} />
            </button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
            <p className="text-emerald-700 font-bold px-6">Check your inbox! We've sent instructions to {email}.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;