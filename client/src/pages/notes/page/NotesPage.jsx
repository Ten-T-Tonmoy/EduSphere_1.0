import React, { useState, useEffect } from 'react';
import api from '../../../utils/Api'; 
import { BookOpen, Users, Star, FileText, Download, LayoutTemplate, X } from 'lucide-react';

import ImportantMaterialsTab from './ImportantMaterialsTab.jsx'; // Add this import
import TeacherSelector from './TeacherSelector.jsx';
import NoteList from './NoteList.jsx';
import NoteForm from './NoteForm.jsx';
import PDFPreviewModal from './PDFPreviewModal.jsx';
import SharedWorkspace from './SharedWorkspace.jsx'; // Imported the new separated file!

import UniLifeLoader from '../../../components/Loader/UniLifeLoader.jsx';

const NotesPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const [activeTab, setActiveTab] = useState('courseMaterial');

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await api.get('/notes/teachers-list'); 
        setTeachers(res.data.teachers);
      } catch (err) {
        setError('Failed to load teachers');
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher && activeTab === 'courseMaterial') {
      fetchNotes(selectedTeacher._id);
    } else {
      setNotes([]);
    }
  }, [selectedTeacher, activeTab]);

  const fetchNotes = async (teacherId) => {
    setLoading(true);
    try {
      const res = await api.get(`/notes/teacher/${teacherId}`);
      setNotes(res.data.notes || []); 
      setIsOwner(res.data.isOwner || false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (noteData) => {
    try {
      const formData = new FormData();
      formData.append('teacherId', selectedTeacher._id);
      formData.append('content', noteData.content);
      noteData.attachments.forEach(file => formData.append('attachments', file));

      const res = await api.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNotes([res.data.note, ...notes]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(notes.filter(n => n._id !== noteId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleGeneratePDF = () => {
    if (notes.length === 0) { alert('No notes to generate PDF'); return; }
    setShowPDFPreview(true);
  };

  const handlePDFGenerate = async (selectedNotes) => {
    try {
      const res = await api.post(`/notes/teacher/${selectedTeacher._id}/generate-pdf`, {
        noteIds: selectedNotes.map(n => n._id)
      });
      window.open(res.data.pdfUrl, '_blank');
      setShowPDFPreview(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      <div className="bg-white border-b border-gray-200 px-4 py-8 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl">
            <LayoutTemplate className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Academic Resources</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm flex items-center gap-3">
             <div className="text-red-500 bg-red-100 rounded-full p-1"><X className="w-4 h-4" /></div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 bg-gray-200/60 p-1.5 rounded-2xl mb-8 w-fit shadow-inner border border-gray-200/80 backdrop-blur-sm">
          <button onClick={() => setActiveTab('courseMaterial')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'courseMaterial' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'}`}>
            <BookOpen className="w-4 h-4" /> Course Material
          </button>
          <button onClick={() => setActiveTab('sharedNotes')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'sharedNotes' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'}`}>
            <Users className="w-4 h-4" /> Shared Notes
          </button>
          <button onClick={() => setActiveTab('classMaterials')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'classMaterials' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'}`}>
            <Star className="w-4 h-4" /> Important Class Materials
          </button>
        </div>

        <div className="transition-all duration-500 ease-in-out">
          
          {/* TAB 1: Course Material */}
          {activeTab === 'courseMaterial' && (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8"><TeacherSelector teachers={teachers} selectedTeacher={selectedTeacher} onSelect={setSelectedTeacher} /></div>

              {selectedTeacher && (
                <div className="mt-8 border-t border-gray-100 pt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-lg"><FileText className="w-6 h-6 text-indigo-600" /></div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Material by {selectedTeacher.name}
                        {!isOwner && <span className="ml-3 inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider uppercase">Shared</span>}
                      </h3>
                    </div>
                    {isOwner && (
                      <button onClick={handleGeneratePDF} disabled={notes.length === 0} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center space-x-2 active:scale-95">
                        <Download className="w-4 h-4" /> <span>Export PDF</span>
                      </button>
                    )}
                  </div>
                  {isOwner && <div className="mb-10"><NoteForm onSubmit={handleAddNote} /></div>}
                  {loading ? (
  /* Branded Loading UI for Academic Materials */
  <div className="flex flex-col justify-center items-center py-20 min-h-[300px] bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
    <UniLifeLoader size="1" />
    <div className="mt-8 flex flex-col items-center">
      <p className="text-xs font-bold text-indigo-500 tracking-[0.3em] uppercase animate-pulse">
        Retrieving Course Material
      </p>
      <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mt-3 opacity-40"></div>
      <p className="text-[10px] text-slate-400 font-medium mt-3 text-center">
        Accessing cloud-stored resources...
      </p>
    </div>
  </div>
                  ) : (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                       <NoteList notes={notes} onDelete={handleDeleteNote} isOwner={isOwner} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Separated Shared Workspace Component */}
          {activeTab === 'sharedNotes' && <SharedWorkspace />}

          {/* TAB 3: Important Class Materials */}
          {activeTab === 'classMaterials' && (
             <ImportantMaterialsTab />
          )}
        </div>
      </main>

      {showPDFPreview && <PDFPreviewModal notes={notes} teacherName={selectedTeacher?.name} onClose={() => setShowPDFPreview(false)} onGenerate={handlePDFGenerate} />}
    </div>
  );
};

export default NotesPage;