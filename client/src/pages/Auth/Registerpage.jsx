// src/pages/Auth/Registerpage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";
import { motion, AnimatePresence } from "framer-motion";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Building2,
  Hash,
  Calendar,
  UserPlus,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    studentId: "",
    employeeId: "",
    year: "",
    semester: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // NEW: For verification notice
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Updated to include class_rep as a student-type role
  const isStudent = form.role === "student" || form.role === "cr";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const response = await register(form);

      // If the backend says verification is required, don't navigate!
      // if (response?.isVerificationRequired) {
      //   setSuccessMessage(response.message);
      //   // Reset form to prevent duplicate submissions
      //   setForm({
      //     name: "", email: "", password: "", role: "student",
      //     department: "", studentId: "", employeeId: "", year: "", semester: ""
      //   });
      // } else {
      //   // Fallback for auto-login if you ever disable verification
      // }
      navigate("/login");
    } catch (err) {
      navigate("/login");
      // PROPER ERROR EXTRACTION (Checks for unique Email/ID errors)
      // const msg = err.response?.data?.message || "Registration failed. Please check your network.";
      // setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-min-h-svh bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] opacity-60" />
      <div className="absolute bottom-0 -left-20 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white rounded-lg shadow-2xl p-8 md:p-12 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200"
          >
            <GraduationCap className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Join the UniLife Ecosystem
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* SUCCESS MESSAGE UI */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-full">
                  <Sparkles size={14} />
                </div>
                Success!
              </div>
              {successMessage}
              <Link
                to="/login"
                className="mt-2 text-[10px] uppercase font-black tracking-widest bg-white/10 p-2 rounded-lg text-center hover:bg-white/20 transition-all"
              >
                Return to Sign In
              </Link>
            </motion.div>
          )}

          {/* ERROR MESSAGE UI */}
          {error && !successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hide form if success message is active to prevent duplicates */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
                    type="text"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={set("name")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                  Account Role
                </label>
                <select
                  className="w-full bg-slate-100/50 border border-slate-200 py-3.5 px-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                  value={form.role}
                  onChange={set("role")}
                >
                  <option value="student">Student</option>
                  <option value="cr">Class Representative</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                  Academic Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
                    type="email"
                    placeholder="you@university.ac.bd"
                    value={form.email}
                    onChange={set("email")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
                    type="password"
                    placeholder="Min. 6 chars"
                    value={form.password}
                    onChange={set("password")}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                Department
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
                  type="text"
                  placeholder="e.g. Information Communication Engg"
                  value={form.department}
                  onChange={set("department")}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isStudent ? (
                <motion.div
                  key="student-fields"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                      Student ID
                    </label>
                    <div className="relative">
                      <Hash
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <input
                        className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
                        type="text"
                        placeholder="2310***1**"
                        value={form.studentId}
                        onChange={set("studentId")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                      Academic Year
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                      />
                      <select
                        className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-bold text-slate-700 appearance-none"
                        value={form.year}
                        onChange={set("year")}
                      >
                        <option value="">Select</option>
                        {[1, 2, 3, 4].map((y) => (
                          <option key={y} value={y}>
                            {y}
                            {["st", "nd", "rd", "th"][y - 1]} Year
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="employee-fields"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] font-black uppercase text-indigo-600 ml-1">
                    Employee ID
                  </label>
                  <div className="relative">
                    <Hash
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      className="w-full bg-slate-100/50 border border-slate-200 py-3.5 pl-11 pr-4 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-all text-sm font-medium"
                      type="text"
                      placeholder="EMP-001"
                      value={form.employeeId}
                      onChange={set("employeeId")}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center h-6">
                  {/* Scaling the brand loader down to 0.4 to fit perfectly inside the button */}
                  <div
                    style={{
                      transform: "scale(0.4)",
                      transformOrigin: "center",
                    }}
                  >
                    <UniLifeLoader />
                  </div>
                  <span className="ml-2 tracking-widest uppercase text-[10px] font-black">
                    Synchronizing...
                  </span>
                </div>
              ) : (
                <>
                  Deploy Account <UserPlus size={18} />
                </>
              )}
            </motion.button>
          </form>
        )}

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Already a member?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            Sign in <ChevronRight size={14} />
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
