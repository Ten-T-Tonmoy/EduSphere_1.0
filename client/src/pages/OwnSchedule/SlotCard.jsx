import { FlaskConical, XCircle, Plus, Clock, Trash2 } from "lucide-react";

const SlotCard = ({ slot, styles, isTeacher, isEditMode, onCancel, onDeletePermanent, onRequestExtra }) => {
  const allTeachers = slot.isLab
    ? slot.teachers || []
    : slot.teacher
      ? [slot.teacher]
      : [];

  return (
    <div
      className={`rounded-lg border p-2 text-xs h-full flex flex-col gap-0.5 transition-all ${styles} ${isEditMode ? 'border-red-200 shadow-sm ring-1 ring-red-100' : ''}`}
    >
      {slot.isLab && (
        <div className="flex items-center gap-1 mb-0.5">
          <FlaskConical className="w-3 h-3 text-purple-600" />
          <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">
            Lab · {slot.labDuration}h
          </span>
        </div>
      )}

      <p className="font-semibold text-sm leading-tight truncate">
        {slot.course?.name || "Unnamed"}
      </p>
      {slot.course?.code && (
        <p className="text-[10px] opacity-50">{slot.course.code}</p>
      )}

      {allTeachers.length > 0 && (
        <div className="mt-0.5">
          {allTeachers.map((t, i) => (
            <p key={t._id || i} className="truncate opacity-70 text-[11px]">
              👤 {t.name || t}
            </p>
          ))}
        </div>
      )}

      {slot.classroom?.name && (
        <p className="truncate opacity-60 text-[11px]">
          🏫 {slot.classroom.name}
        </p>
      )}

      {slot.room && <p className="opacity-50 text-[11px]">📍 {slot.room}</p>}

      {slot.status === "cancelled" && (
        <div className="mt-1">
          <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
            CANCELLED (TEMP)
          </span>
        </div>
      )}
      
      {slot.status === "extra" && (
        <span className="mt-1 inline-block bg-green-200 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
          EXTRA (TEMP)
        </span>
      )}

      {slot.status === "pending" && (
        <span className="mt-1 inline-block bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-max">
          <Clock className="w-3 h-3" /> PENDING
        </span>
      )}

      <div className="mt-auto pt-1.5 flex gap-1 flex-wrap">
        
        {/* EDIT MODE: Permanent Deletion */}
        {isEditMode && isTeacher && (
          <button
            onClick={onDeletePermanent}
            className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors font-bold shadow-sm w-full justify-center mt-1"
          >
            <Trash2 className="w-3 h-3" /> Delete Permanent
          </button>
        )}

        {/* DEFAULT MODE: Temporary Actions */}
        {!isEditMode && isTeacher && (slot.status === "scheduled" || slot.status === "extra" || slot.status === "pending") && (
          <button
            onClick={onCancel}
            className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors font-semibold w-max"
          >
            <XCircle className="w-2.5 h-2.5" /> Cancel (Temp)
          </button>
        )}
        
        {!isEditMode && slot.status === "cancelled" && (
          <button
            onClick={onRequestExtra}
            className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors font-semibold"
          >
            <Plus className="w-2.5 h-2.5" /> Request Temp Class
          </button>
        )}
      </div>
    </div>
  );
};

export default SlotCard;