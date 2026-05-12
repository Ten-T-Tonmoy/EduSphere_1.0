// src/pages/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Book,
  Users,
  ArrowRight,
  Github,
  Linkedin,
  CheckCircle2,
  Calendar,
  PieChart,
  Timer,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contributors, setContributors] = useState([]);
  const [activeDocTab, setActiveDocTab] = useState(0);

  useEffect(() => {
    api
      .get("/contributors")
      .then((res) => setContributors(res.data.data))
      .catch(() => {});
  }, []);

  // Animation Variants for Scroll interaction
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, amount: 0.1 },
    transition: { duration: 0.8, ease: "easeOut" },
  };

  const fadeInLeft = {
    initial: { opacity: 0, x: -60 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: false, amount: 0.1 },
    transition: { duration: 0.8, ease: "easeOut" },
  };

  const fadeInRight = {
    initial: { opacity: 0, x: 60 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: false, amount: 0.1 },
    transition: { duration: 0.8, ease: "easeOut" },
  };

  const features = [
    {
      title: "Smart Attendance Matrix",
      desc: "Interactive grid visualization of your attendance. Stay ahead of the 75% requirement automatically.",
      icon: <CheckCircle2 className="text-emerald-500" />,
      tag: "Academic",
    },
    {
      title: "Shared Workspaces",
      desc: "Collaborate on notes and resources in real-time. Share PDFs and lecture materials with your batch.",
      icon: <Users className="text-indigo-500" />,
      tag: "Social",
    },
    {
      title: "Financial Tracker",
      desc: "A student-first expense manager. Track your mess bills, stationery, and daily costs effortlessly.",
      icon: <PieChart className="text-rose-500" />,
      tag: "Lifestyle",
    },
    {
      title: "Focus Pomodoro",
      desc: "Integrated study timer designed to boost productivity during exam seasons.",
      icon: <Timer className="text-amber-500" />,
      tag: "Productivity",
    },
    {
      title: "Real-time Ecosystem",
      desc: "Get instant push notifications for class cancellations or extra room assignments.",
      icon: <Zap className="text-sky-500" />,
      tag: "Sync",
    },
    {
      title: "AI ExamCrack Support",
      desc: "Integrated support to help summarize complex syllabus topics and track exam preparation.",
      icon: <Sparkles className="text-violet-500" />,
      tag: "New",
    },
  ];

  const docSteps = [
    {
      title: "1. Join your Batch",
      content:
        "Enter your classroom PIN to instantly sync with your batch's schedule, notes, and notices.",
      icon: <Users size={20} />,
    },
    {
      title: "2. Manage Schedule",
      content:
        "CRs can add extra classes or cancel sessions. Students see updates instantly on their dynamic routine.",
      icon: <Calendar size={20} />,
    },
    {
      title: "3. Track Progress",
      content:
        "Use the Syllabus Tracker and Attendance Matrix to visualize your semester journey in real-time.",
      icon: <PieChart size={20} />,
    },
  ];

  return (
    <div className="min-min-h-svh bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <Book className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight">
              UniLife <span className="text-indigo-600">Manager</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a
              href="#features"
              className="hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a href="#docs" className="hover:text-indigo-600 transition-colors">
              Documentation
            </a>
            <Link
              to="/contributors"
              className="hover:text-indigo-600 transition-colors"
            >
              Team
            </Link>
            <Link
              to="/login"
              className="px-5 py-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Login
            </Link>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              {user ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Entry Animation */}
      <section className="relative pt-48 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 mb-8"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              A Complete University Ecosystem
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "circOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-6 leading-[1]"
          >
            One Platform. <br />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Entire Campus Life.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
          >
            Join thousands of students simplifying their academic journey with
            our modular, real-time university management system.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to={user ? "/dashboard" : "/register"}
              className="group flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
            >
              Launch App{" "}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#docs"
              className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 border border-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              Quick Start Guide
            </a>
          </motion.div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-200/20 blur-[120px] -z-0 rounded-full"></div>
      </section>

      {/* Features Grid - Arrive from Bottom */}
      <section
        id="features"
        className="py-24 px-6 bg-white border-y border-slate-100"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">
              Powerful Features
            </h2>
            <p className="text-slate-500 font-medium">
              Everything you need to survive and thrive in university.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl group-hover:rotate-6 transition-transform">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-400">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Section - Arrive from Left */}
      <section id="docs" className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeInLeft}>
              <div className="flex items-center gap-2 text-indigo-400 mb-4 font-bold uppercase tracking-[0.3em] text-[10px]">
                <HelpCircle size={14} /> Documentation
              </div>
              <h2 className="text-5xl font-black mb-8 leading-tight">
                Built for <br />
                <span className="text-indigo-400">Seamless Adoption.</span>
              </h2>
              <div className="space-y-4">
                {docSteps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDocTab(idx)}
                    className={`p-6 rounded-3xl cursor-pointer transition-all border ${activeDocTab === idx ? "bg-indigo-600 border-indigo-400 shadow-xl" : "bg-slate-800/50 border-slate-700 hover:border-slate-500"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-xl ${activeDocTab === idx ? "bg-white text-indigo-600" : "bg-slate-700 text-slate-400"}`}
                      >
                        {step.icon}
                      </div>
                      <h4 className="font-bold text-xl">{step.title}</h4>
                    </div>
                    <AnimatePresence>
                      {activeDocTab === idx && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 text-indigo-100 text-sm leading-relaxed"
                        >
                          {step.content}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeInRight} className="relative">
              <div className="bg-slate-800 aspect-square rounded-[4rem] flex items-center justify-center border border-slate-700 shadow-2xl relative z-10 overflow-hidden">
                <div className="text-center p-10">
                  <Book className="w-20 h-20 text-indigo-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Complete Guide</h3>
                  <p className="text-slate-400 mb-8 font-medium">
                    Learn more about the ecosystem's advanced role permissions
                    and API integrations.
                  </p>
                  <button
                    onClick={() => navigate("/documentation")}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                  >
                    View Full Documentation
                  </button>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-30"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contributors Section - Arrive from Left (Bottom section) */}
      <section id="team" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            {...fadeInLeft}
            className="text-4xl font-black tracking-tight mb-4 uppercase"
          >
            Crafted by Engineers
          </motion.h2>
          <motion.p
            {...fadeInLeft}
            transition={{ delay: 0.1 }}
            className="text-slate-500 mb-16 font-medium"
          >
            The development core behind the ecosystem.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {contributors.map((member, idx) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white p-3 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="relative aspect-square overflow-hidden rounded-[1.5rem] mb-4">
                  <img
                    src={member.photo}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    alt={member.name}
                  />
                  <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h4 className="font-bold text-slate-900 mb-1 truncate px-2">
                  {member.name}
                </h4>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
                  {member.role}
                </p>
                <div className="flex justify-center gap-3 pb-2">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <Github size={16} />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Linkedin size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="mt-16 inline-flex items-center gap-2 px-10 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm group active:scale-95"
          >
            <Users size={18} /> Join our Community{" "}
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-800 pt-12">
          <div className="text-center md:text-left">
            <h3 className="text-white font-black text-lg mb-2 tracking-widest uppercase">
              UniLife Manager
            </h3>
            <p className="text-sm">
              Redefining the university experience through modular innovation.
            </p>
          </div>
          <div className="flex gap-6 font-bold text-xs uppercase tracking-widest">
            <a href="#docs" className="hover:text-white transition-colors">
              Guide
            </a>
            <Link
              to="/contributors"
              className="hover:text-white transition-colors"
            >
              Team
            </Link>
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
          </div>
        </div>
        <div className="text-center mt-12 text-xs text-slate-600 font-bold">
          © 2026 UniLife Manager Ecosystem. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
