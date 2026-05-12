// src/pages/Auth/Loginpage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, Book, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/Authcontext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Premium Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] opacity-60" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-60" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white rounded-lg shadow-2xl p-8 md:p-12 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200"
          >
            <Book className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium text-sm">Access your UniLife Ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-indigo-600 ml-1">Academic Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="email" required
                className="w-full bg-slate-100/50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-medium"
                placeholder="name@university.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[11px] font-black uppercase text-indigo-600">Password</label>
              <Link to="/reset-password" title="Recover Password" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">Forgot?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="password" required
                className="w-full bg-slate-100/50 border border-slate-200 py-4 pl-12 pr-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 transition-all font-medium"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all mt-8"
          >
            Sign In <LogIn size={18} />
          </motion.button>
        </form>

        <p className="text-center mt-10 text-sm font-medium text-slate-500">
          New to the ecosystem? {' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;