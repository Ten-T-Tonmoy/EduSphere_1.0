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
export const DAY_IDX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
};

export const fmtTime = (t) => {
  const [h] = t.split(":").map(Number);
  return h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
};

export const slotLabel = (start, end) => `${fmtTime(start)} – ${fmtTime(end)}`;

export const addHours = (time, hours) => {
  const [h, m] = time.split(":").map(Number);
  return `${String(h + hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const slotRowSpan = (slot) => (slot.isLab ? slot.labDuration || 2 : 1);

// FIX: Added 'pending' background style coloring
export const STATUS_STYLES = {
  scheduled: "bg-blue-50 border-blue-200",
  cancelled: "bg-red-50 border-red-300",
  extra: "bg-green-50 border-green-200",
  pending: "bg-yellow-50 border-yellow-300", 
};

export const LAB_STYLES = {
  scheduled: "bg-purple-50 border-purple-200",
  cancelled: "bg-red-50 border-red-300",
  extra: "bg-green-50 border-green-200",
  pending: "bg-yellow-50 border-yellow-300",
};

export const getCoveredCells = (slots) => {
  const covered = new Set();
  slots.forEach((slot) => {
    if (slotRowSpan(slot) > 1) {
      const day = DAYS[slot.dayOfWeek];
      const startIdx = TIME_SLOTS.indexOf(slot.startTime);
      for (let i = 1; i < slotRowSpan(slot); i++) {
        if (TIME_SLOTS[startIdx + i]) {
          covered.add(`${day}-${TIME_SLOTS[startIdx + i]}`);
        }
      }
    }
  });
  return covered;
};