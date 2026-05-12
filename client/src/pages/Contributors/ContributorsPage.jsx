import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Added for animations
import api from "../../utils/Api";
import { useAuth } from "../../context/Authcontext";
import {
  Trash2,
  Github,
  Linkedin,
  Sparkles,
  UserPlus,
  Edit3,
} from "lucide-react";
import ContributorFormModal from "./ContributorFormModal";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";

const ContributorsPage = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  const isSuperAdmin = user?.email?.toLowerCase() === "admin39326220@gmail.com";

  const fetchTeam = async () => {
    try {
      const res = await api.get("/contributors");
      setMembers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setShowModal(true);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.delete(`/contributors/${id}`);
      fetchTeam();
    } catch (err) {
      alert("Failed to delete member.");
    }
  };

  // Animation Variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-indigo-600 font-bold tracking-widest animate-pulse">
        <UniLifeLoader size="0.8" />
        <span className="ml-2">SYNCHRONIZING TEAM DATA...</span>
      </div>
    );

  return (
    <div className="min-h-screen  bg-slate-50 text-slate-900 overflow-y-auto lg:overflow-hidden font-sans flex flex-col relative">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
      ></div>

      {/* Animated Header */}
      <motion.header
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 pt-8 pb-10 px-4 text-center"
      >
        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-indigo-60 text-indigo-500 border border-indigo-600 mb-4">
          <Sparkles size={10} className="animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-wider">
            The Development Core
          </span>
        </div>
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-650 mb-3">
          Project{" "}
          <span className="text-indigo-600">Architects and Designers</span>
        </h1>
        <p className="text-slate-600 font-medium text-sm lg:text-base">
          Meet the engineers behind the UniLife Manager ecosystem.
        </p>

        {isSuperAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddNew}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <UserPlus size={18} /> Manage Team
          </motion.button>
        )}
      </motion.header>

      {/* Main Grid with Staggered Entry */}
      <main className="relative z-10 flex-1 px-4 sm:px-10 mb-24 flex items-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="w-full max-w-[800px] grid grid-cols-1 sm:grid-cols-2 gap-7 h-full max-h-[600px]"
        >
          {members.slice(0, 2).map((member) => (
            <motion.div
              key={member._id}
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group relative flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500"
            >
              {/* Photo Container */}
              <div className="p-6 flex-shrink-none">
                <div
                  className="relative rounded-[10rem] overflow-hidden aspect-square border
                rounded-full border-slate-150 shadow-inner transform transition-shadow duration-900 group-hover:shadow-lg group-hover:shadow-indigo-500"
                >
                  <img
                    src={member.photo}
                    className="w-full h-full object-cover rounded-full
                     grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 cursor-pointer transform hover:scale-105"
                    alt={member.name}
                  />

                  {/* Social Float Bar */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-white/90 backdrop-blur shadow-lg rounded-xl text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      <Github size={18} />
                    </a>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-white/90 backdrop-blur shadow-lg rounded-xl text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="px-3 pb-4 pt-1 flex flex-col flex-1 text-center">
                <h1 className="text-xl font-black text-slate-900 leading-tight mb-1">
                  {member.name}
                </h1>
                <p className="text-indigo-600 text-[14px] font-black uppercase tracking-widest mb-4">
                  {member.role}
                </p>

                <div className="flex flex-wrap justify-center gap-2.5 mt-auto">
                  {member.contributions?.slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      className="text-[12px] font-bold uppercase bg-slate-200 text-slate-800 px-2 py-1 rounded-lg border border-slate-100"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Admin Action Buttons */}
              {isSuperAdmin && (
                <div className="absolute top-6 right-6 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(member)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Edit3 size={14} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(member._id)}
                    className="p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </main>

      <AnimatePresence>
        {showModal && (
          <ContributorFormModal
            onClose={() => setShowModal(false)}
            onSave={fetchTeam}
            initialData={selectedMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContributorsPage;
