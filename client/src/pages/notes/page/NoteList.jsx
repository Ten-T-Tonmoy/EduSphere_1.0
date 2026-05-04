import React, { useState } from 'react';
import ShareModal from './ShareModal';

const NoteList = ({ notes, onDelete, isOwner }) => {
  const [selectedNote, setSelectedNote] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = (note) => {
    setSelectedNote(note);
    setShowShareModal(true);
  };

  // --- NEW: Relative Time Formatter ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTargetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.floor((startOfToday - startOfTargetDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      const diffMs = now - date;
      if (diffMs < 60000) return 'Just now';
      return `Today at ${timeStr}`;
    }
    if (dayDiff === 1) return `Yesterday at ${timeStr}`;
    if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago at ${timeStr}`;
    if (dayDiff >= 7 && dayDiff < 30) {
      const weeks = Math.floor(dayDiff / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago at ${timeStr}`;
    }
    if (dayDiff >= 30 && dayDiff < 365) {
      const months = Math.floor(dayDiff / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(dayDiff / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

  const extractTitle = (html) => {
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (match) return match[1].replace(/<[^>]*>/g, '');
    const text = html.replace(/<[^>]*>/g, '').trim().split('\n')[0];
    return text.substring(0, 50) + (text.length > 50 ? '...' : '');
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-gray-600">No notes yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {notes.map(note => {
          const title = extractTitle(note.content);
          const contentWithoutTitle = note.content.replace(/<h1[^>]*>.*?<\/h1>/i, '');
          return (
            <div key={note._id} className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white hover:shadow-lg transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 break-words">{title}</h3>
                    <span className="text-sm font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-lg">{formatDate(note.createdAt)}</span>
                  </div>
                  <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: contentWithoutTitle }} />
                  
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                      <div className="flex flex-wrap gap-2">
                        {note.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 transition"
                          >
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isOwner && (
                  <div className="flex space-x-2 self-end sm:self-start">
                    <button onClick={() => handleShare(note)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Share">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    <button onClick={() => onDelete(note._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showShareModal && selectedNote && (
        <ShareModal note={selectedNote} onClose={() => setShowShareModal(false)} onShared={() => setShowShareModal(false)} />
      )}
    </>
  );
};

export default NoteList;