import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, Loader2, CheckSquare } from 'lucide-react';

const PDFPreviewModal = ({ notes = [], teacherName = "Course", onClose }) => {
  const [editedNotes, setEditedNotes] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize notes with a 'selected' property
  useEffect(() => {
    if (notes && notes.length > 0) {
      setEditedNotes(notes.map(n => ({ ...n, selected: true })));
    }
  }, [notes]);

  const toggleNote = (index) => {
    setEditedNotes(prev => prev.map((n, i) => i === index ? { ...n, selected: !n.selected } : n));
  };

  const extractTitle = (html) => {
    if (!html) return 'Untitled Note';
    const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (match) return match[1].replace(/<[^>]*>/g, '');
    const text = html.replace(/<[^>]*>/g, '').trim().split('\n')[0];
    return text.substring(0, 40) + (text.length > 40 ? '...' : '');
  };

  // 100% CRASH-PROOF NATIVE EXPORT
  // Bypasses Tailwind v4 'oklch' bugs by using the Native Browser Print Engine
  const handleGenerate = () => {
    const selected = editedNotes.filter(n => n.selected);
    if (selected.length === 0) {
      alert('Please select at least one note to export.');
      return;
    }

    setIsExporting(true);

    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // 2. Build a beautiful, pristine HTML document for the Native Print Engine
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${teacherName} - Course Materials</title>
        <style>
          @page { margin: 20mm; size: A4; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            color: #0f172a; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 20px; 
            margin-bottom: 40px; 
          }
          .header h1 { font-size: 28px; font-weight: 800; margin: 0 0 10px 0; }
          .header p { color: #64748b; font-size: 14px; margin: 0; }
          .note { margin-bottom: 40px; page-break-inside: avoid; }
          .note-date { 
            font-size: 11px; 
            font-weight: bold; 
            color: #94a3b8; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            border-bottom: 1px solid #f1f5f9; 
            padding-bottom: 8px; 
            margin-bottom: 16px; 
          }
          .prose { font-size: 14px; color: #334155; }
          .prose h1, .prose h2, .prose h3 { color: #0f172a; margin-top: 24px; margin-bottom: 12px; }
          .prose p { margin-bottom: 16px; }
          .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
          .prose a { color: #4f46e5; text-decoration: none; }
          .prose pre, .prose code { 
            background-color: #f8fafc; 
            padding: 12px; 
            border-radius: 6px; 
            font-family: monospace; 
            font-size: 12px; 
            white-space: pre-wrap; 
            word-wrap: break-word; 
          }
          .prose ul, .prose ol { padding-left: 24px; margin-bottom: 16px; }
          .prose li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Course Materials</h1>
          <p>Instructor: ${teacherName} &nbsp;&bull;&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        ${selected.map(note => `
          <div class="note">
            <div class="note-date">Document Entry: ${new Date(note.createdAt).toLocaleString()}</div>
            <div class="prose">
              ${note.content || '<p>No content available.</p>'}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // 3. Inject the HTML into the hidden iframe
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(printHTML);
    iframe.contentWindow.document.close();

    // 4. Trigger Native Print Dialog (Allows user to "Save as PDF")
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print Error:", err);
        alert("Failed to open print dialog.");
      } finally {
        // Cleanup after dialog closes
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
          setIsExporting(false);
          onClose();
        }, 1000);
      }
    }, 500); // 500ms delay ensures browser renders any images before printing
  };

  if (!notes || notes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Export Course Materials</h3>
              <p className="text-xs font-semibold text-slate-500">Teacher: {teacherName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Split Layout Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Sidebar: Note Selection */}
          <div className="w-full md:w-1/3 border-r border-slate-100 bg-white flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-50 bg-white z-10 shrink-0">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" /> Select Content
              </h4>
              <p className="text-xs text-slate-500 mt-1">Choose which notes to include in the final export.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {editedNotes.map((note, idx) => (
                <label 
                  key={note._id || idx} 
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                    note.selected ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={note.selected} 
                    onChange={() => toggleNote(idx)} 
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${note.selected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {extractTitle(note.content)}
                    </p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${note.selected ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Right Main: Visual Preview */}
          <div className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Document Preview</p>
            
            <div className="bg-white mx-auto shadow-sm w-full max-w-[816px] border border-slate-200 p-10 sm:p-16">
              <div className="w-full bg-white text-black">
                
                <div className="border-b-2 border-slate-200 pb-6 mb-8 text-center">
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Course Materials</h1>
                  <p className="text-sm font-semibold text-slate-500">
                    Instructor: {teacherName} &nbsp;&bull;&nbsp; Generated: {new Date().toLocaleDateString()}
                  </p>
                </div>
                
                {editedNotes.filter(n => n.selected).length === 0 ? (
                   <p className="text-center text-slate-400 italic py-10">No notes selected for export.</p>
                ) : (
                  editedNotes.filter(n => n.selected).map((note, idx) => (
                    <div key={idx} className="mb-10 pb-10 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
                      <p className="text-xs font-bold text-slate-400 mb-4 tracking-wide uppercase">
                        Document Entry: {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <div 
                        className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: note.content || '<p>No content available.</p>' }} 
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer / Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 z-10">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={isExporting || editedNotes.filter(n => n.selected).length === 0}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {isExporting ? 'Preparing...' : 'Export / Print PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PDFPreviewModal;