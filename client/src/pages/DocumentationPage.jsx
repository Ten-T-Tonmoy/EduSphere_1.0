// src/pages/DocumentationPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Book, CheckCircle, HelpCircle, Layout, Shield, Zap, Info, Globe, Smartphone, Laptop } from 'lucide-react';
import UniLifeLoader from '../components/Loader/UniLifeLoader';

const DocumentationPage = () => {
  const sections = [
    {
      title: "What is UniLife Manager?",
      icon: <Info className="text-blue-500" />,
      content: "UniLife Manager is a unified University Management Ecosystem designed to bridge the gap between students, class representatives (CRs), and faculty. It acts as a single source of truth for academic schedules, attendance tracking, and resource sharing."
    },
    {
      title: "Why every student needs this?",
      icon: <Zap className="text-amber-500" />,
      content: "Fragmentation is the enemy of academic success. Students often juggle multiple apps for notices, attendance, and notes. UniLife Ecosystem centralizes this, reducing 'attendance anxiety' via real-time matrix visualization and ensuring no one misses a rescheduled class."
    },
    {
      title: "Where can I use it?",
      icon: <Globe className="text-emerald-500" />,
      platforms: [
        { label: "Mobile Browser", icon: <Smartphone size={16}/>, desc: "Optimized for on-campus quick checks." },
        { label: "Desktop/Tablet", icon: <Laptop size={16}/>, desc: "Full-feature dashboard for management." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            <Book size={14} /> Knowledge Base
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Ecosystem Documentation</h1>
          <p className="text-slate-500 font-medium">Master the tools designed for your academic excellence.</p>
        </header>

        <div className="space-y-12">
          {sections.map((sec, i) => (
            <motion.section 
              key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 rounded-2xl">{sec.icon}</div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{sec.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">{sec.content}</p>
              
              {sec.platforms && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  {sec.platforms.map((p, j) => (
                    <div key={j} className="p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                      <div className="mt-1 text-indigo-600">{p.icon}</div>
                      <div>
                        <div className="font-bold text-sm">{p.label}</div>
                        <div className="text-xs text-slate-400">{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          ))}

          {/* Feature Breakdown */}
          <section className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl shadow-indigo-200">
            <h2 className="text-3xl font-black mb-10 flex items-center gap-3">
              <Zap size={28} /> Core Functionalities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-black uppercase tracking-widest text-[10px] opacity-70">For Students</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-indigo-300"/> Real-time Attendance Matrix</li>
                  <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-indigo-300"/> Personal Expense Tracker</li>
                  <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-indigo-300"/> Shared PDF Notes Library</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-black uppercase tracking-widest text-[10px] opacity-70">For Class Reps</h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-indigo-300"/> Dynamic Routine Overrides</li>
                  <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-indigo-300"/> Bulk Attendance Marking</li>
                  <li className="flex items-center gap-3 text-sm font-bold"><CheckCircle size={16} className="text-indigo-300"/> Noticeboard Broadcasting</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;