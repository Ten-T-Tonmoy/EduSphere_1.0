 

export const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export const fmtTime = (t) => {
  const [h] = t.split(":").map(Number);
  return h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
};

export const STATUS_BG = {
  scheduled: {
    regular: "bg-blue-50 border-blue-200 text-blue-900",
    lab: "bg-purple-50 border-purple-200 text-purple-900",
  },
  cancelled: "bg-red-50 border-red-200 text-red-800",
  extra: "bg-green-50 border-green-200 text-green-900",
};

export const rowSpan = (slot) => (slot.isLab ? slot.labDuration || 2 : 1);

// You can add more department-specific utilities here
export const groupByYearAndSem = (classrooms) => {
  return [...classrooms].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.currentSemester - b.currentSemester;
  });
};

export const getCoveredCells = (slots) => {
  const covered = new Set();
  slots.forEach((slot) => {
    if (rowSpan(slot) > 1) {
      const cid = slot.classroom?._id || slot.classroom;
      const startIdx = TIME_SLOTS.indexOf(slot.startTime);
      for (let i = 1; i < rowSpan(slot); i++) {
        if (TIME_SLOTS[startIdx + i]) {
          covered.add(`${cid}-${slot.dayOfWeek}-${TIME_SLOTS[startIdx + i]}`);
        }
      }
    }
  });
  return covered;
};

export const buildGrid = (classrooms, slots) => {
  const grid = {};
  classrooms.forEach((cls) => {
    grid[cls._id] = {};
    DAYS.forEach((_, di) => {
      grid[cls._id][di] = {};
      TIME_SLOTS.forEach((t) => {
        grid[cls._id][di][t] = null;
      });
    });
  });
  slots.forEach((slot) => {
    const cid = slot.classroom?._id || slot.classroom;
    const day = slot.dayOfWeek;
    const time = slot.startTime;
    if (grid[cid]?.[day]?.[time] !== undefined) {
      grid[cid][day][time] = slot;
    }
  });
  return grid;
};
