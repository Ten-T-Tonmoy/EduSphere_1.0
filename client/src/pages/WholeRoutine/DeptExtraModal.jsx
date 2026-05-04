import { X } from "lucide-react";
import { DAYS } from "./DeptScheduleUtils";

const DeptExtraModal = ({
  show,
  slot,
  onClose,
  onConfirm,
  form,
  setForm,
  courses,
  submitting,
  userRole,
}) => {
  if (!show || !slot) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-gray-900">
            Request Extra Class
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot info summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
          <p>
            <span className="font-medium">Slot: </span>
            {DAYS[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime}
          </p>
          <p>
            <span className="font-medium">Classroom: </span>
            {slot.classroom?.name}
          </p>
          {slot.cancellationReason && (
            <p className="text-red-600 text-xs mt-1 italic">
              Cancelled: {slot.cancellationReason}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Extra Class *
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.requestedDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, requestedDate: e.target.value }))
              }
            />
          </div>

          {/* Course picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course (optional)
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.course}
              onChange={(e) =>
                setForm((p) => ({ ...p, course: e.target.value }))
              }
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No courses found for this classroom
                {userRole === "teacher" ? " assigned to you" : ""}.
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Why do you need this extra class?"
              value={form.reason}
              onChange={(e) =>
                setForm((p) => ({ ...p, reason: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? "Sending..." : "Send Request"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeptExtraModal;
