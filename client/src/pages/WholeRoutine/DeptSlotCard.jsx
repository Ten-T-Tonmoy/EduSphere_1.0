import { Plus } from "lucide-react";
import { STATUS_BG } from "./DeptScheduleUtils";

const DeptSlotCard = ({ slot, onRequestExtra }) => {
  if (!slot) return null;

  const allTeachers = slot.isLab
    ? slot.teachers || []
    : slot.teacher
      ? [slot.teacher]
      : [];

  const style =
    slot.status === "cancelled"
      ? STATUS_BG.cancelled
      : slot.status === "extra"
        ? STATUS_BG.extra
        : slot.isLab
          ? STATUS_BG.scheduled.lab
          : STATUS_BG.scheduled.regular;

  return (
    <div
      className={`rounded border p-1.5 text-[11px] h-full flex flex-col gap-0.5 ${style}`}
    >
      {slot.isLab && (
        <p className="text-[9px] font-bold uppercase tracking-wide text-purple-600">
          Lab {slot.labDuration}h
        </p>
      )}

      <p className="font-semibold leading-tight truncate">
        {slot.course?.name || "—"}
      </p>

      {slot.course?.code && (
        <p className="opacity-50 text-[9px]">{slot.course.code}</p>
      )}

      {allTeachers.length > 0 && (
        <p className="opacity-70 truncate">
          {allTeachers.map((t) => t.name).join(", ")}
        </p>
      )}

      {slot.room && <p className="opacity-50">[{slot.room}]</p>}

      {slot.status === "cancelled" && (
        <>
          <p className="text-red-600 font-bold text-[9px]">CANCELLED</p>
          {slot.cancellationReason && (
            <p className="text-[9px] opacity-60 italic line-clamp-1">
              {slot.cancellationReason}
            </p>
          )}
          <button
            onClick={() => onRequestExtra(slot)}
            className="mt-auto flex items-center gap-0.5 text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded transition-colors w-fit"
          >
            <Plus className="w-2.5 h-2.5" />
            Request Extra
          </button>
        </>
      )}

      {slot.status === "extra" && (
        <p className="text-green-700 font-bold text-[9px]">EXTRA</p>
      )}
    </div>
  );
};

export default DeptSlotCard;
