import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../utils/Api";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

const eventTypeColors = {
  holiday: "bg-red-100 text-red-700 border-red-200",
  exam: "bg-purple-100 text-purple-700 border-purple-200",
  semester_start: "bg-green-100 text-green-700 border-green-200",
  semester_end: "bg-orange-100 text-orange-700 border-orange-200",
  registration: "bg-blue-100 text-blue-700 border-blue-200",
  result: "bg-teal-100 text-teal-700 border-teal-200",
  event: "bg-yellow-100 text-yellow-700 border-yellow-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const CalendarPage = () => {
  const { classroomId } = useParams();
  const { user } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [selectedCal, setSelectedCal] = useState(null);
  const [showAddCal, setShowAddCal] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [calForm, setCalForm] = useState({
    academicYear: "2024-2025",
    semester: 1,
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    type: "event",
    color: "#3B82F6",
  });
  const [loading, setLoading] = useState(true);

  const canManage = ["teacher", "admin", "class_rep"].includes(user?.role);

  useEffect(() => {
    fetchCalendars();
  }, [classroomId]);

  const fetchCalendars = async () => {
    try {
      const res = await api.get(`/calendar/classroom/${classroomId}`);
      setCalendars(res.data);
      if (res.data.length > 0 && !selectedCal) setSelectedCal(res.data[0]);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleAddCal = async () => {
    try {
      const res = await api.post("/calendar", {
        ...calForm,
        classroom: classroomId,
        events: [],
      });
      setShowAddCal(false);
      fetchCalendars();
    } catch (err) {
      alert("Failed");
    }
  };

  const handleAddEvent = async () => {
    if (!selectedCal) return;
    try {
      await api.post(`/calendar/${selectedCal._id}/event`, eventForm);
      setShowAddEvent(false);
      setEventForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        type: "event",
        color: "#3B82F6",
      });
      fetchCalendars();
    } catch (err) {
      alert("Failed");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!selectedCal) return;
    try {
      await api.delete(`/calendar/${selectedCal._id}/event/${eventId}`);
      fetchCalendars();
    } catch (err) {}
  };

  // Sort events by start date
  const sortedEvents =
    selectedCal?.events
      ?.slice()
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)) || [];
  const upcomingEvents = sortedEvents.filter(
    (e) => new Date(e.endDate || e.startDate) >= new Date(),
  );
  const pastEvents = sortedEvents.filter(
    (e) => new Date(e.endDate || e.startDate) < new Date(),
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary-600" /> Academic
          Calendar
        </h1>
        <div className="flex gap-2">
          {canManage && selectedCal && (
            <button
              onClick={() => setShowAddEvent(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowAddCal(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> New Calendar
            </button>
          )}
        </div>
      </div>

      {/* Calendar tabs */}
      {calendars.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {calendars.map((cal) => (
            <button
              key={cal._id}
              onClick={() => setSelectedCal(cal)}
              className={`px-4 py-2 rounded-lg text-sm font-medium shrink-0 transition-colors ${selectedCal?._id === cal._id ? "bg-blue-400 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {cal.academicYear} Sem {cal.semester}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <UniLifeLoader size="md" />
        </div>
      ) : !selectedCal ? (
        <div className="card text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No calendar yet.</p>
          {canManage && (
            <button
              onClick={() => setShowAddCal(true)}
              className="btn-primary mt-3"
            >
              Create Calendar
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Upcoming */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              Upcoming Events ({upcomingEvents.length})
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-400 text-sm italic">
                No upcoming events.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <div
                    key={event._id}
                    className={`card border group flex items-start gap-3 ${eventTypeColors[event.type] || eventTypeColors.other}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{event.title}</h3>
                        <span
                          className="badge border"
                          style={{
                            backgroundColor: event.color + "20",
                            color: event.color,
                            borderColor: event.color + "40",
                          }}
                        >
                          {event.type.replace("_", " ")}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm opacity-80 mt-0.5">
                          {event.description}
                        </p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {event.endDate &&
                          event.endDate !== event.startDate &&
                          ` – ${new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-500 mb-3 text-sm">
                Past Events
              </h2>
              <div className="space-y-2 opacity-60">
                {pastEvents.map((event) => (
                  <div
                    key={event._id}
                    className="card border border-gray-100 flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-700">
                          {event.title}
                        </p>
                        <span className="badge bg-gray-100 text-gray-500">
                          {event.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddCal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-4">
              New Academic Calendar
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label">Academic Year</label>
                <input
                  className="input"
                  placeholder="2024-2025"
                  value={calForm.academicYear}
                  onChange={(e) =>
                    setCalForm((p) => ({ ...p, academicYear: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Semester</label>
                <select
                  className="input"
                  value={calForm.semester}
                  onChange={(e) =>
                    setCalForm((p) => ({
                      ...p,
                      semester: parseInt(e.target.value),
                    }))
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddCal} className="btn-primary flex-1">
                Create
              </button>
              <button
                onClick={() => setShowAddCal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Add Event</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Title *</label>
                <input
                  className="input"
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={eventForm.type}
                  onChange={(e) =>
                    setEventForm((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  {Object.keys(eventTypeColors).map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    className="input"
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) =>
                      setEventForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    className="input"
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) =>
                      setEventForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  placeholder="Optional description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddEvent} className="btn-primary flex-1">
                Add Event
              </button>
              <button
                onClick={() => setShowAddEvent(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
