import React, { useState, useEffect } from "react";
import api from "../services/api";
import TeacherSelector from "../components/notes/TeacherSelector";
import NoteList from "../components/notes/NoteList";
import NoteForm from "../components/notes/NoteForm";
import PDFPreviewModal from "../components/notes/PDFPreviewModal";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

const NotesPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get("/teachers");
        setTeachers(res.data.teachers);
      } catch (err) {
        setError("Failed to load teachers");
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher) {
      fetchNotes(selectedTeacher._id);
    } else {
      setNotes([]);
    }
  }, [selectedTeacher]);

  const fetchNotes = async (teacherId) => {
    setLoading(true);
    try {
      const res = await api.get(`/notes/teacher/${teacherId}`);
      setNotes(res.data.notes);
      setIsOwner(res.data.isOwner || false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (noteData) => {
    try {
      const formData = new FormData();
      formData.append("teacherId", selectedTeacher._id);
      formData.append("content", noteData.content);
      noteData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await api.post("/notes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotes([res.data.note, ...notes]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(notes.filter((n) => n._id !== noteId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete note");
    }
  };

  const handleGeneratePDF = () => {
    if (notes.length === 0) {
      alert("No notes to generate PDF");
      return;
    }
    setShowPDFPreview(true);
  };

  const handlePDFGenerate = async (selectedNotes) => {
    try {
      const res = await api.post(
        `/notes/teacher/${selectedTeacher._id}/generate-pdf`,
        {
          noteIds: selectedNotes.map((n) => n._id),
        },
      );
      window.open(res.data.pdfUrl, "_blank");
      setShowPDFPreview(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate PDF");
    }
  };

  return (
    <div className="min-min-h-svh bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
            Notes
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <TeacherSelector
            teachers={teachers}
            selectedTeacher={selectedTeacher}
            onSelect={setSelectedTeacher}
          />

          {selectedTeacher && (
            <>
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  Notes for {selectedTeacher.name}
                  {!isOwner && (
                    <span className="ml-2 text-sm text-indigo-600">
                      (Shared with you)
                    </span>
                  )}
                </h3>
                {isOwner && (
                  <button
                    onClick={handleGeneratePDF}
                    disabled={notes.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Generate PDF</span>
                  </button>
                )}
              </div>

              {isOwner && <NoteForm onSubmit={handleAddNote} />}

              {loading ? (
                <div className="flex justify-center py-8">
                  <UniLifeLoader size="md" />
                </div>
              ) : (
                <NoteList
                  notes={notes}
                  onDelete={handleDeleteNote}
                  isOwner={isOwner}
                />
              )}
            </>
          )}
        </div>
      </main>

      {showPDFPreview && (
        <PDFPreviewModal
          notes={notes}
          teacherName={selectedTeacher.name}
          onClose={() => setShowPDFPreview(false)}
          onGenerate={handlePDFGenerate}
        />
      )}
    </div>
  );
};

export default NotesPage;
