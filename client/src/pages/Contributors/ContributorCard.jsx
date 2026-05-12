import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { useAuth } from "../../context/Authcontext";
import { Plus, Trash2, Github, Linkedin, Sparkles, Code2 } from "lucide-react";
import ContributorFormModal from "./ContributorFormModal";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";

const ContributorsPage = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // THE KEY CHECK: Only this email sees the "Add" and "Delete" buttons
  const isSuperAdmin = user?.email === "admin39326220@gmail.com";

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

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this genius?")) return;
    await api.delete(`/contributors/${id}`);
    fetchTeam();
  };

  if (loading) {
    return (
      <div className="min-min-h-svh bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Glows to match the page theme */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Your exact UniLifeLoader component */}
          <UniLifeLoader size="1.2" />

          <div className="mt-10 flex flex-col items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4">
              <Code2 className="text-indigo-400 w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">
                Initializing Architects
              </span>
            </div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-min-h-svh bg-[#0f172a] text-white pb-20 overflow-hidden font-sans">
      {/* Premium Background Animation Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <header className="relative pt-20 pb-12 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 animate-bounce">
          <Sparkles className="text-amber-400 w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            The Elite Squad
          </span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          Project <span className="text-indigo-500">Architects</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
          Crafting the future of university management with code, passion, and
          precision.
        </p>

        {isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="mt-10 group relative px-8 py-4 bg-white text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <Plus size={20} /> ADD CONTRIBUTOR
          </button>
        )}
      </header>

      <main className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
        {members.map((member, idx) => (
          <div
            key={member._id}
            className="group relative animate-in fade-in slide-in-from-bottom-10 duration-1000"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-100 transition duration-1000"></div>

            <div className="relative bg-[#1e293b]/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 h-full">
              <div className="relative mb-8 rounded-[2rem] overflow-hidden aspect-square border-4 border-white/5 shadow-2xl">
                <img
                  src={member.photo}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={member.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-6 opacity-0 group-hover:opacity-100 transition-all">
                  <div className="flex gap-3">
                    <a
                      href={member.github}
                      className="p-3 bg-white/10 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                      <Github size={18} />
                    </a>
                    <a
                      href={member.linkedin}
                      className="p-3 bg-white/10 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-black mb-1">{member.name}</h3>
              <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-6">
                {member.role}
              </p>

              <div className="flex flex-wrap gap-2">
                {member.contributions?.map((c, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-black uppercase bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-gray-400"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => handleDelete(member._id)}
                  className="absolute top-6 right-6 p-3 bg-red-500/20 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </main>

      {showModal && (
        <ContributorFormModal
          onClose={() => setShowModal(false)}
          onSave={fetchTeam}
        />
      )}
    </div>
  );
};

export default ContributorsPage;
