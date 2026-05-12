import React, { useState, useEffect } from "react";
import api from "../../utils/Api";
import { useAuth } from "../../context/Authcontext";
import "./RequestsApproval.css";
import UniLifeLoader from "../Loader/UniLifeLoader";

const RequestsApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/groups/join-requests");
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const confirmAction = (requestId, status) => {
    const request = requests.find((r) => r._id === requestId);
    const roleToAssign =
      selectedRole[requestId] || request?.requestedRole || "student";

    setPendingAction({
      requestId,
      status,
      userName: request?.user.name,
      groupName: request?.group.name,
      roleToAssign: status === "approved" ? roleToAssign : null,
    });
    setShowConfirmModal(true);
  };

  const handleConfirmedAction = async () => {
    if (!pendingAction) return;

    const { requestId, status, roleToAssign } = pendingAction;

    setProcessingId(requestId);
    setError("");
    setShowConfirmModal(false);

    try {
      const response = await api.put(`/groups/join-request/${requestId}`, {
        status,
        assignRole: roleToAssign,
      });

      if (response.data.success) {
        setRequests((prev) => prev.filter((req) => req._id !== requestId));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setProcessingId(null);
      setPendingAction(null);
    }
  };

  const handleRoleChange = (requestId, role) => {
    setSelectedRole((prev) => ({
      ...prev,
      [requestId]: role,
    }));
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "teacher":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cr":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  if (!user || !["admin", "teacher", "cr"].includes(user.role)) {
    return (
      <div className="premium-approval-card">
        <div className="text-center py-16">
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
            <svg
              className="h-10 w-10 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            Access Restricted
          </h3>
          <p className="mt-2 text-gray-500 font-medium">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="premium-approval-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
              Requests Approval
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Review and manage group join requests
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm border border-indigo-100 w-full sm:w-auto"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        <div className="border-b border-gray-200/60 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
            {["all", "pending", "approved", "rejected"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`premium-filter-tab py-3 px-1 font-bold text-sm tracking-wide capitalize whitespace-nowrap ${
                  filter === filterType
                    ? "text-indigo-600 active"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {filterType}
                {filterType === "pending" &&
                  requests.filter((r) => r.status === "pending").length > 0 && (
                    <span className="ml-2 bg-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                      {requests.filter((r) => r.status === "pending").length}
                    </span>
                  )}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
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
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button
              onClick={fetchRequests}
              className="text-sm text-red-700 font-bold underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <UniLifeLoader size="1" />
            <p className="mt-6 text-xs font-bold text-indigo-400 tracking-[0.2em] uppercase animate-pulse">
              Fetching Requests...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <svg
                className="h-8 w-8 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800">
              No requests found
            </h3>
            <p className="mt-2 text-sm text-gray-500 font-medium">
              {filter === "all"
                ? "Your inbox is clear! There are no requests right now."
                : `No ${filter} requests match your filter.`}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredRequests.map((request) => (
              <div key={request._id} className="request-premium-item p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-5">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-extrabold text-xl shadow-inner border border-white">
                          {request.user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 tracking-tight">
                          {request.user.name}
                        </h4>
                        <p className="text-sm text-gray-500 font-medium">
                          {request.user.email}
                        </p>

                        {/* ✅ FIX: Dynamic display of Student ID directly below email */}
                        {request.user.studentId && (
                          <p className="text-sm font-bold text-indigo-600 mt-1">
                            ID: {request.user.studentId}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2.5 mt-3">
                          <span
                            className={`badge-glow text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getRoleBadgeColor(request.user.role)}`}
                          >
                            Role: {request.user.role}
                          </span>
                          <span className="badge-glow text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            Wants: {request.requestedRole || "student"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="mt-5 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-gray-50 rounded-lg">
                          <svg
                            className="h-5 w-5 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-800 font-bold">
                          {request.group.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium whitespace-nowrap">
                        {new Date(request.requestedAt).toLocaleString(
                          undefined,
                          { dateStyle: "medium", timeStyle: "short" },
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Section - Only show for pending requests */}
                  {request.status === "pending" && (
                    <div className="lg:w-80 bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                      <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase mb-2">
                          Approve As
                        </label>
                        <select
                          value={
                            selectedRole[request._id] ||
                            request.requestedRole ||
                            "student"
                          }
                          onChange={(e) =>
                            handleRoleChange(request._id, e.target.value)
                          }
                          className="premium-select-inline w-full text-sm font-semibold text-gray-700 px-4 py-3 mb-4 appearance-none cursor-pointer"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="cr">CR</option>
                        </select>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => confirmAction(request._id, "approved")}
                          disabled={processingId === request._id}
                          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl text-white transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center space-x-1 ${
                            processingId === request._id
                              ? "bg-emerald-400 shadow-none"
                              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-200"
                          }`}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => confirmAction(request._id, "rejected")}
                          disabled={processingId === request._id}
                          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
                            processingId === request._id
                              ? "bg-gray-100 text-gray-400"
                              : "bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:-translate-y-0.5"
                          }`}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show status for non-pending requests */}
                  {request.status !== "pending" && (
                    <div className="lg:w-48 flex items-center justify-center lg:justify-end h-full">
                      <span
                        className={`badge-glow px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-widest border shadow-sm ${getStatusBadgeColor(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingAction && (
        <div className="fixed inset-0 modal-glass-overlay flex items-center justify-center p-4">
          <div className="relative modal-glass-content w-full max-w-sm p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <div
                className={`mx-auto flex items-center justify-center h-16 w-16 rounded-2xl mb-5 shadow-inner ${
                  pendingAction.status === "approved"
                    ? "bg-emerald-100 border border-emerald-200"
                    : "bg-rose-100 border border-rose-200"
                }`}
              >
                {pendingAction.status === "approved" ? (
                  <svg
                    className="h-8 w-8 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-8 w-8 text-rose-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {pendingAction.status === "approved"
                  ? "Approve Member?"
                  : "Reject Member?"}
              </h3>

              <p className="text-sm text-gray-500 font-medium mb-1">
                Are you sure you want to {pendingAction.status} the request from{" "}
                <span className="font-bold text-gray-900">
                  {pendingAction.userName}
                </span>
                ?
              </p>

              <div className="bg-gray-50 rounded-lg p-3 my-4 border border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Target Group
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {pendingAction.groupName}
                </p>
              </div>

              {pendingAction.status === "approved" && (
                <p className="text-sm text-gray-500 font-medium mb-6">
                  Role to be assigned:{" "}
                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md ml-1">
                    {pendingAction.roleToAssign}
                  </span>
                </p>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all focus:outline-none focus:ring-4 focus:ring-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmedAction}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${
                    pendingAction.status === "approved"
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-200 focus:ring-emerald-100"
                      : "bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-rose-200 focus:ring-rose-100"
                  }`}
                >
                  Yes,{" "}
                  {pendingAction.status === "approved" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestsApproval;
