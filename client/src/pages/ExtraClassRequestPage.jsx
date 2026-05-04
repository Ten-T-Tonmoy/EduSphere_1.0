import React, { useEffect, useState } from "react";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import { ClipboardCheck, Check, X, Clock, Calendar } from "lucide-react";
import UniLifeLoader from "../components/Loader/UniLifeLoader";


const statusStyles = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ExtraClassRequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState({});

  const canManage = ["class_rep", "teacher", "admin"].includes(user?.role);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/schedules/extra-class-requests?status=${filter}`,
      );
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      await api.put(`/schedules/extra-class-request/${id}`, {
        status,
        reviewNote: reviewNote[id] || "",
      });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Extra Class Requests
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${
              filter === s
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <UniLifeLoader size="md" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No {filter} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const slot = req.emptySlot;
            return (
              <div
                key={req._id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyles[req.status]}`}
                      >
                        {req.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{req._id.slice(-6)}
                      </span>
                    </div>

                    <p className="font-semibold text-gray-900">
                      {req.targetClassroom?.name}
                    </p>

                    {/* Slot info */}
                    {slot && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {DAYS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                        </span>
                        {slot.course && (
                          <span className="text-gray-400">
                            · {slot.course.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Requested date */}
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        For:{" "}
                        <span className="font-medium">
                          {new Date(req.requestedDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </span>
                    </div>

                    {req.course && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Course: {req.course.name} ({req.course.code})
                      </p>
                    )}
                  </div>

                  {/* Requested by */}
                  <div className="text-right text-xs text-gray-400">
                    <p>Requested by</p>
                    <p className="font-medium text-gray-700">
                      {req.requestedBy?.name}
                    </p>
                    <p className="capitalize">
                      {req.requestedBy?.role?.replace("_", " ")}
                    </p>
                    <p className="mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p className="text-xs font-semibold text-gray-400 mb-1">
                    REASON
                  </p>
                  {req.reason}
                </div>

                {/* Review note if exists */}
                {req.reviewNote && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <p className="text-xs font-semibold text-blue-400 mb-1">
                      REVIEW NOTE
                    </p>
                    {req.reviewNote}
                    {req.reviewedBy && (
                      <p className="text-xs text-blue-400 mt-1">
                        — {req.reviewedBy.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons — only for CR/teacher on pending */}
                {canManage && req.status === "pending" && (
                  <div className="mt-4 space-y-2">
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="Optional review note..."
                      value={reviewNote[req._id] || ""}
                      onChange={(e) =>
                        setReviewNote((p) => ({
                          ...p,
                          [req._id]: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(req._id, "approved")}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(req._id, "rejected")}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExtraClassRequestsPage;
