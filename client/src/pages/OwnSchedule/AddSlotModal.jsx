import { FlaskConical } from "lucide-react";
import Modal from "./Modal";
import ModalFooter from "./ModalFooter";
import { DAYS, DAY_IDX, TIME_SLOTS, fmtTime } from "./scheduleUtils";

const AddSlotModal = ({
  show,
  onClose,
  form,
  setForm,
  classrooms,
  courses,
  teachers,
  fetchCoursesFor,
  onAdd,
}) => {
  if (!show) return null;

  const toggleLabTeacher = (id) => {
    setForm((p) => ({
      ...p,
      teachers: p.teachers.includes(id)
        ? p.teachers.filter((t) => t !== id)
        : [...p.teachers, id],
    }));
  };

  return (
    <Modal title="Add Class Slot" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => setForm((p) => ({ ...p, isLab: false }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              !form.isLab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border"
            }`}
          >
            Regular Class
          </button>
          <button
            onClick={() => setForm((p) => ({ ...p, isLab: true }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              form.isLab
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> Lab
          </button>
        </div>

        <div>
          <label className="label">Classroom / Batch</label>
          <select
            className="input"
            value={form.classroom}
            onChange={(e) => {
              setForm((p) => ({ ...p, classroom: e.target.value }));
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

        <div>
          <label className="label">Course</label>
          <select
            className="input"
            value={form.course}
            onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Day</label>
            <select
              className="input"
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  dayOfWeek: parseInt(e.target.value),
                }))
              }
            >
              {DAYS.map((d) => (
                <option key={d} value={DAY_IDX[d]}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Start Time</label>
            <select
              className="input"
              value={form.startTime}
              onChange={(e) =>
                setForm((p) => ({ ...p, startTime: e.target.value }))
              }
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {fmtTime(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.isLab && (
          <div>
            <label className="label">Lab Duration</label>
            <div className="flex gap-2">
              {[2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => setForm((p) => ({ ...p, labDuration: h }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.labDuration === h
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {h} hours
                </button>
              ))}
            </div>
          </div>
        )}

        {!form.isLab ? (
          <div>
            <label className="label">Teacher</label>
            <select
              className="input"
              value={form.teacher}
              onChange={(e) =>
                setForm((p) => ({ ...p, teacher: e.target.value }))
              }
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} — {t.department || t.email}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">
              Lab Teachers{" "}
              <span className="text-gray-400 font-normal">
                (select multiple)
              </span>
            </label>
            <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
              {teachers.map((t) => (
                <label
                  key={t._id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.teachers.includes(t._id)}
                    onChange={() => toggleLabTeacher(t._id)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t.department || t.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {form.teachers.length > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                {form.teachers.length} teacher
                {form.teachers.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        <div>
          <label className="label">Room / Lab</label>
          <input
            className="input"
            placeholder="e.g. Lab-3, Room 201"
            value={form.room}
            onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
          />
        </div>
      </div>

      <ModalFooter
        onConfirm={onAdd}
        onCancel={onClose}
        confirmLabel="Add Slot"
        confirmClass={`${form.isLab ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
      />
    </Modal>
  );
};

export default AddSlotModal;
