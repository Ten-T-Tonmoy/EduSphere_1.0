import Modal from "./Modal";
import ModalFooter from "./ModalFooter";
import { DAYS } from "./scheduleUtils";

const CancelModal = ({ show, slot, onClose, onConfirm, reason, setReason }) => {
  if (!show || !slot) return null;

  return (
    <Modal title="Cancel Class" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-medium">{slot.course?.name}</span> —{" "}
        {DAYS[slot.dayOfWeek]} {slot.startTime}
      </p>
      <label className="label">Reason for cancellation</label>
      <textarea
        className="input"
        rows={3}
        placeholder="e.g. Teacher unwell, departmental meeting..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <ModalFooter
        onConfirm={onConfirm}
        onCancel={onClose}
        confirmLabel="Cancel Class"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </Modal>
  );
};

export default CancelModal;
