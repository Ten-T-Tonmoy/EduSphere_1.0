import React, { useState } from "react";
import api from "../../utils/Api";
import UniLifeLoader from "../Loader/UniLifeLoader";

const CreateGroup = ({ onGroupCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    pin: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await api.post("/groups/create", formData);
      if (response.data.success) {
        setSuccess("Group created successfully!");
        setFormData({ name: "", pin: "", description: "" });
        if (onGroupCreated) {
          onGroupCreated(response.data.group);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="premium-form-card relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-indigo-100/60 shadow-[0_10px_40px_rgba(99,102,241,0.08)] bg-white/90 backdrop-blur-xl">
    {/* Background Glow */}
    <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-200/30 blur-3xl rounded-full pointer-events-none" />
    <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-200/30 blur-3xl rounded-full pointer-events-none" />

    {/* Header */}
    <div className="relative mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
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
          <h3 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Create New Group
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Build a collaborative academic workspace.
          </p>
        </div>
      </div>
    </div>

    {/* Error */}
    {error && (
      <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 flex items-start gap-3 shadow-sm">
        <div className="mt-0.5">
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
        <span className="text-sm font-semibold text-red-700">{error}</span>
      </div>
    )}

    {/* Success */}
    {success && (
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 flex items-start gap-3 shadow-sm">
        <div className="mt-0.5">
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
        <span className="text-sm font-semibold text-emerald-700">
          {success}
        </span>
      </div>
    )}

    {/* Form */}
    <form onSubmit={handleSubmit} className="relative space-y-6">
      {/* Group Name */}
      <div className="space-y-2">
        <label
          htmlFor="groupName"
          className="text-sm font-bold tracking-wide text-gray-700"
        >
          Group Name
        </label>

        <div className="relative">
          <input
            type="text"
            id="groupName"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="premium-input w-full rounded-2xl border border-gray-200/80 bg-white/80 px-5 py-3.5 text-gray-800 shadow-sm transition-all duration-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            placeholder="e.g. Computer Science 101"
          />
        </div>
      </div>

      {/* PIN */}
      <div className="space-y-2">
        <label
          htmlFor="pin"
          className="text-sm font-bold tracking-wide text-gray-700"
        >
          Group PIN{" "}
          <span className="text-gray-400 font-medium">(4-10 chars)</span>
        </label>

        <div className="relative">
          <input
            type="text"
            id="pin"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            required
            minLength="4"
            maxLength="10"
            className="premium-input w-full rounded-2xl border border-gray-200/80 bg-white/80 px-5 py-3.5 text-gray-800 tracking-[0.35em] font-mono shadow-sm transition-all duration-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
            placeholder="••••••"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-bold tracking-wide text-gray-700"
        >
          Description{" "}
          <span className="text-gray-400 font-medium">(Optional)</span>
        </label>

        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="premium-input w-full rounded-2xl border border-gray-200/80 bg-white/80 px-5 py-3.5 text-gray-800 resize-none shadow-sm transition-all duration-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          placeholder="What is this group about?"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`group relative overflow-hidden w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-5 py-4 font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl hover:shadow-indigo-500/30 active:scale-[0.99] ${
          loading ? "opacity-70 cursor-wait" : ""
        }`}
      >
        <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <span className="relative flex items-center justify-center gap-3">
          {loading ? (
            <div className="h-6 flex items-center overflow-hidden">
              <UniLifeLoader />
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
                  d="M12 4v16m8-8H4"
                />
              </svg>

              <span>Create Group</span>
            </>
          )}
        </span>
      </button>
    </form>
  </div>
);}
export default CreateGroup;
