import React, { useState } from "react";
import api from "../../utils/Api";
import { useAuth } from "../../context/Authcontext";
import UniLifeLoader from "../Loader/UniLifeLoader";

const JoinGroup = ({ onRequestSent }) => {
  const [formData, setFormData] = useState({
    groupName: "",
    pin: "",
    requestedRole: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/groups/join-request", formData);
      if (response.data.success) {
        setSuccess(
          "Join request sent successfully! Waiting for admin approval.",
        );
        setFormData({ groupName: "", pin: "", requestedRole: "student" });
        if (onRequestSent) {
          onRequestSent(response.data.request);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send join request");
    } finally {
      setLoading(false);
    }
  };

  // Determine available roles based on user's actual role
  const getAvailableRoles = () => {
    if (user?.role === "teacher") {
      return [
        { value: "student", label: "Student" },
        { value: "teacher", label: "Teacher" },
      ];
    } else if (user?.role === "cr") {
      return [
        { value: "student", label: "Student" },
        { value: "cr", label: "CR" },
      ];
    } else {
      return [{ value: "student", label: "Student" }];
    }
  };

  return (
    <div className="premium-form-card relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-emerald-100/60 shadow-[0_10px_40px_rgba(16,185,129,0.08)] bg-white/90 backdrop-blur-xl">
      {/* Background Glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-200/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-teal-200/30 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5V4H2v16h5m10 0v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4m10 0H7"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Join Existing Group
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Enter the credentials to send a join request.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="relative mb-6 rounded-2xl border-l-4 border-l-red-500 border border-red-200 bg-red-50/90 backdrop-blur-sm px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="relative mb-6 rounded-2xl border-l-4 border-l-emerald-500 border border-emerald-200 bg-emerald-50/90 backdrop-blur-sm px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-5 w-5 text-emerald-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                {success}
              </p>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="flex-shrink-0 text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="relative space-y-6">
        {/* Group Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="groupName"
            className="text-sm font-bold tracking-wide text-gray-700 flex items-center gap-2"
          >
            <svg
              className="h-4 w-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Group Name
          </label>
          <div className="relative group">
            <input
              type="text"
              id="groupName"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-gray-200/80 bg-white/80 px-5 py-3.5 text-gray-800 shadow-sm transition-all duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none"
              placeholder="e.g. Computer Science 101"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 to-teal-500/0 opacity-0 transition-opacity duration-300 pointer-events-none group-focus-within:opacity-100" />
          </div>
        </div>

        {/* PIN Field */}
        <div className="space-y-2">
          <label
            htmlFor="pin"
            className="text-sm font-bold tracking-wide text-gray-700 flex items-center gap-2"
          >
            <svg
              className="h-4 w-4 text-teal-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Group PIN
            <span className="text-gray-400 font-medium text-xs">
              (required)
            </span>
          </label>
          <div className="relative group">
            <input
              type="text"
              id="pin"
              name="pin"
              value={formData.pin}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-gray-200/80 bg-white/80 px-5 py-3.5 text-gray-800 tracking-[0.35em] font-mono shadow-sm transition-all duration-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Role Selection Field */}
        <div className="space-y-2">
          <label
            htmlFor="requestedRole"
            className="text-sm font-bold tracking-wide text-gray-700 flex items-center gap-2"
          >
            <svg
              className="h-4 w-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Request as Role
          </label>
          <div className="relative group">
            <select
              id="requestedRole"
              name="requestedRole"
              value={formData.requestedRole}
              onChange={handleChange}
              className="w-full rounded-2xl border border-gray-200/80 bg-white/80 px-5 py-3.5 text-gray-800 appearance-none cursor-pointer shadow-sm transition-all duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none"
            >
              {getAvailableRoles().map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                  className="font-medium text-gray-700"
                >
                  {role.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Info Badge */}
          <div className="flex items-start gap-2 mt-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-3.5 w-3.5 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              You can only request roles that match your actual role
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`relative group w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-5 py-4 font-bold text-white shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-[0.99] ${
            loading ? "opacity-70 cursor-wait" : ""
          }`}
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <span className="relative flex items-center justify-center gap-3">
            {loading ? (
              <div className="h-6 flex items-center justify-center">
                <UniLifeLoader size="0.4" />
              </div>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Request to Join</span>
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
};

export default JoinGroup;
