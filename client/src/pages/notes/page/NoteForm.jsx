import React, { useState } from 'react';
import RichTextEditor from './RichTextEditor';

const NoteForm = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const invalid = files.some(f => f.size > 10 * 1024 * 1024);
    if (invalid) {
      alert('Each file must be less than 10MB');
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!content || content === '<p><br></p>') {
      alert('Please enter note content');
      return;
    }
    setSubmitting(true);
    // Wrap title in H1 with Tailwind classes for styling
    const fullContent = `<h1 class="text-2xl font-bold mb-4">${title}</h1>${content}`;
    await onSubmit({ content: fullContent, attachments });
    setTitle('');
    setContent('');
    setAttachments([]);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 sm:p-6 border border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-sm">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Add New Note</h4>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          placeholder="Note title (will be displayed as heading)"
          required
        />
      </div>

      <div className="mb-4 flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Zoom:</label>
        <input
          type="range"
          min="50"
          max="200"
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
          className="w-32 accent-indigo-600"
        />
        <span className="text-sm text-gray-600">{zoom}%</span>
      </div>

      <div className="mb-4 border rounded-lg overflow-hidden" style={{ zoom: `${zoom}%` }}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write your note here... (supports formatting, tables, colors, etc.)"
        />
      </div>

      <div className="mt-6 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Attachments (optional)</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {submitting ? 'Adding...' : 'Add Note'}
      </button>
    </form>
  );
};

export default NoteForm;