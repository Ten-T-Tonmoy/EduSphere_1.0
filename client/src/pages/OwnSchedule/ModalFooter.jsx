const ModalFooter = ({
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  confirmClass = "bg-blue-600 hover:bg-blue-700 text-white",
}) => (
  <div className="flex gap-2 mt-4">
    <button
      onClick={onConfirm}
      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${confirmClass}`}
    >
      {confirmLabel}
    </button>
    <button
      onClick={onCancel}
      className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      Cancel
    </button>
  </div>
);

export default ModalFooter;
