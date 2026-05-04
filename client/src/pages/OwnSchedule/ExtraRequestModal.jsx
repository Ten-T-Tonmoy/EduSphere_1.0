import Modal from "./Modal";
import ModalFooter from "./ModalFooter";
import { DAYS } from "./scheduleUtils";

const ExtraRequestModal = ({
  show,
  slot,
  onClose,
  onConfirm,
  reason,
  setReason,
  course,
  setCourse,
  classroom,
  setClassroom,
  classrooms,
  courses,
  fetchCoursesFor,
}) => {
  if (!show || !slot) return null;

  return (
    <Modal title="Request Extra Class" onClose={onClose}>
      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
        <p>
          <span className="font-medium">Slot: </span>
          {DAYS[slot.dayOfWeek]} · {slot.startTime}
        </p>
        {slot.classroom?.name && (
          <p>
            <span className="font-medium">Classroom: </span>
            {slot.classroom.name}
          </p>
        )}
        {slot.cancellationReason && (
          <p className="text-red-600 text-xs mt-1 italic">
            Cancelled: {slot.cancellationReason}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {slot.status === "empty" && (
          <div>
            <label className="label">Classroom *</label>
            <select
              className="input"
              value={classroom}
              onChange={(e) => {
                setClassroom(e.target.value);
                fetchCoursesFor(e.target.value);
              }}
            >
              <option value="">Select classroom</option>
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {(slot.status !== "empty" || classroom) && (
          <div>
            <label className="label">Course (optional)</label>
            <select
              className="input"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Reason *</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Why do you need this extra class?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      <ModalFooter
        onConfirm={onConfirm}
        onCancel={onClose}
        confirmLabel="Send Request"
      />
    </Modal>
  );
};

export default ExtraRequestModal;
