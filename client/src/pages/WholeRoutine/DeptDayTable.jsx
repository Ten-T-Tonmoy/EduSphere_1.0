import React from "react";
import { ChevronDown, Plus } from "lucide-react";
import DeptSlotCard from "./DeptSlotCard";
import { TIME_SLOTS, fmtTime, rowSpan } from "./DeptScheduleUtils";
import UniLifeLoader from "../../components/Loader/UniLifeLoader";


const DeptDayTable = ({
  day,
  dayIdx,
  isToday,
  isCollapsed,
  onToggle,
  classrooms,
  grid,
  coveredCells,
  rowGroups,
  onEmptySlotClick,
  onRequestExtra,
}) => {
  const hasSlots = classrooms.some((c) =>
    Object.values(grid[c._id]?.[dayIdx] || {}).some((slot) => slot !== null),
  );

  return (
    <div
      className={`mb-4 rounded-xl border overflow-hidden shadow-sm ${
        isToday ? "border-blue-400" : "border-gray-200"
      }`}
    >
      {/* Day header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-sm transition-colors ${
          isToday
            ? "bg-blue-600 text-white"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span className="flex items-center gap-2">
          {day}
          {isToday && (
            <span className="text-blue-200 font-normal text-xs">Today</span>
          )}
          {!hasSlots && (
            <span
              className={`text-xs font-normal ${
                isToday ? "text-blue-200" : "text-gray-400"
              }`}
            >
              — no classes
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isCollapsed ? "-rotate-90" : ""
          }`}
        />
      </button>

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-2 py-2 text-left font-semibold text-gray-500 border-r border-gray-200 w-12 whitespace-nowrap">
                  Year
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 border-r border-gray-200 w-12 whitespace-nowrap">
                  Sem
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-500 border-r border-gray-200 w-28">
                  Batch
                </th>
                {TIME_SLOTS.map((t, ti) => (
                  <th
                    key={t}
                    className="px-2 py-2 text-center font-semibold text-gray-500 border-r border-gray-200 last:border-r-0 min-w-[130px] whitespace-nowrap"
                  >
                    {fmtTime(t)}
                    <span className="text-gray-300 mx-0.5">–</span>
                    {fmtTime(TIME_SLOTS[ti + 1] || "17:00")}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rowGroups.map((classroom, ri) => {
                const cid = classroom._id;
                return (
                  <tr
                    key={cid}
                    className={`border-b border-gray-100 ${
                      ri % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    }`}
                  >
                    <td className="px-2 py-1.5 border-r border-gray-200 font-semibold text-gray-700 whitespace-nowrap align-middle">
                      {classroom.year}
                    </td>
                    <td className="px-2 py-1.5 border-r border-gray-200 text-gray-500 whitespace-nowrap align-middle">
                      {classroom.currentSemester}
                    </td>
                    <td className="px-2 py-1.5 border-r border-gray-200 font-medium text-gray-800 align-middle">
                      {classroom.name}
                    </td>

                    {TIME_SLOTS.map((time) => {
                      const cellKey = `${cid}-${dayIdx}-${time}`;
                      if (coveredCells.has(cellKey)) return null;

                      const slot = grid[cid]?.[dayIdx]?.[time];
                      const span = slot ? rowSpan(slot) : 1;

                      return (
                        <td
                          key={time}
                          colSpan={span}
                          className="px-1 py-1 border-r border-gray-200 last:border-r-0 align-top min-w-[130px]"
                        >
                          {slot ? (
                            <DeptSlotCard
                              slot={slot}
                              onRequestExtra={onRequestExtra}
                            />
                          ) : (
                            <button
                              onClick={() =>
                                onEmptySlotClick(classroom, dayIdx, time)
                              }
                              className="h-full min-h-[48px] w-full rounded border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center group transition-colors"
                            >
                              <Plus className="w-3 h-3 text-gray-200 group-hover:text-blue-400 transition-colors" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeptDayTable;
