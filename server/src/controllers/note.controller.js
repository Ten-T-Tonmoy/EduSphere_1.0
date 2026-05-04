const Note = require('../models/Note');
const NotePDF = require('../models/NotePDF');
const Teacher = require('../models/Teacher');
const supabase = require('../config/supabase');
const User = require('../models/User');
const Group = require('../models/Group');
const fs = require('fs').promises;
const path = require('path');

// Optional: try to load puppeteer, but gracefully handle if missing
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (err) {
  console.warn('⚠️ Puppeteer not installed. PDF generation will fallback to pdfkit (basic formatting only).');
}

// pdfkit fallback (if puppeteer unavailable)
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (err) {
  console.warn('⚠️ pdfkit not installed. PDF generation will be limited.');
}

// Helper to upload to Supabase (unchanged)
const uploadToSupabase = async (file, userId, bucketName) => {
  const timestamp = Date.now();
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  
  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return { publicUrl: urlData.publicUrl, supabasePath: fileName };
};

// @desc    Get all notes for a teacher (including shared with user)
// @route   GET /api/notes/teacher/:teacherId
exports.getNotes = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const userId = req.user.id;

    const teacher = await Teacher.findOne({ _id: teacherId, user: userId });
    if (!teacher) {
      const sharedNotes = await Note.find({
        teacher: teacherId,
        $or: [
          { sharedWith: userId },
          { sharedWithGroups: { $in: (await Group.find({ 'members.user': userId })).map(g => g._id) } }
        ]
      }).populate('user', 'name').sort('-createdAt');
      return res.json({ success: true, notes: sharedNotes, isOwner: false });
    }

    const notes = await Note.find({ user: userId, teacher: teacherId }).sort('-createdAt');
    res.json({ success: true, notes, isOwner: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new note with HTML content and optional attachments
// @route   POST /api/notes
exports.createNote = async (req, res) => {
  try {
    const { teacherId, content } = req.body;
    if (!teacherId || !content) {
      return res.status(400).json({ success: false, message: 'Teacher and content are required' });
    }

    const teacher = await Teacher.findOne({ _id: teacherId, user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'unilife-uploads';
    const attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToSupabase(file, req.user.id, bucketName);
        attachments.push({
          fileName: file.originalname,
          fileUrl: uploadResult.publicUrl,
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    const note = await Note.create({
      user: req.user.id,
      teacher: teacherId,
      content,
      attachments
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share a note with users or groups
// @route   POST /api/notes/share/:noteId
exports.shareNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userIds, groupIds } = req.body;
    const note = await Note.findOne({ _id: noteId, user: req.user.id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (userIds) {
      note.sharedWith = [...new Set([...note.sharedWith, ...userIds])];
    }
    if (groupIds) {
      note.sharedWithGroups = [...new Set([...note.sharedWithGroups, ...groupIds])];
    }
    await note.save();

    res.json({ success: true, message: 'Note shared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a note (owner only)
// @route   DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------- PDF Generation with Puppeteer (rich formatting) + fallback ----------
const generatePdfWithPuppeteer = async (htmlContent, outputPath) => {
  if (!puppeteer) throw new Error('Puppeteer not available');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer'
    ]
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  await browser.close();
};

const generatePdfWithPdfkit = async (notes, teacherName, outputPath) => {
  return new Promise((resolve, reject) => {
    if (!PDFDocument) return reject(new Error('pdfkit not installed'));
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    
    doc.fontSize(20).text(`Notes for ${teacherName}`, { align: 'center' });
    doc.moveDown();
    
    notes.forEach((note, idx) => {
      doc.fontSize(12).text(`${new Date(note.createdAt).toLocaleString()} - Note #${idx+1}`, { continued: false });
      doc.moveDown(0.5);
      // Strip HTML tags for plain text
      const plainText = note.content.replace(/<[^>]*>/g, '');
      doc.fontSize(10).text(plainText, { align: 'left' });
      if (note.attachments && note.attachments.length) {
        doc.fontSize(9).text('Attachments:');
        note.attachments.forEach(att => {
          doc.fontSize(8).text(`- ${att.fileName}`);
        });
      }
      doc.moveDown();
      if (idx < notes.length - 1) doc.addPage();
    });
    
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

// @desc    Generate PDF from selected notes (rich HTML -> PDF with Puppeteer, fallback to pdfkit)
// @route   POST /api/notes/teacher/:teacherId/generate-pdf
exports.generateTeacherPDF = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { noteIds } = req.body;

    const teacher = await Teacher.findOne({ _id: teacherId, user: req.user.id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    let query = { user: req.user.id, teacher: teacherId };
    if (noteIds && noteIds.length > 0) {
      query._id = { $in: noteIds };
    }
    const notes = await Note.find(query).sort('createdAt');

    if (notes.length === 0) {
      return res.status(400).json({ success: false, message: 'No notes to generate PDF' });
    }

    // Prepare output path
    const timestamp = Date.now();
    const fileName = `notes_${teacher.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    const pdfDir = path.join(__dirname, '../pdfs');
    await fs.mkdir(pdfDir, { recursive: true });
    const localPath = path.join(pdfDir, fileName);

    // Try Puppeteer first (preserves all formatting)
    let pdfUrl;
    let usedFallback = false;

    try {
      // Build full HTML document
      const buildHTML = () => {
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Notes for ${teacher.name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; line-height: 1.6; }
              .note { margin-bottom: 40px; page-break-after: always; }
              .note-header { font-size: 14px; color: #666; border-bottom: 1px solid #ccc; margin-bottom: 15px; padding-bottom: 5px; }
              .note-content { margin-top: 10px; }
              .note-content * { max-width: 100%; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              blockquote { border-left: 4px solid #ccc; margin: 10px 0; padding-left: 15px; color: #555; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <h1 style="text-align:center;">Notes for ${teacher.name}</h1>
        `;
        notes.forEach((note, idx) => {
          html += `
            <div class="note">
              <div class="note-header">
                Note #${idx + 1} – ${new Date(note.createdAt).toLocaleString()}
              </div>
              <div class="note-content">
                ${note.content}
              </div>
            </div>
          `;
        });
        html += `</body></html>`;
        return html;
      };

      await generatePdfWithPuppeteer(buildHTML(), localPath);
      pdfUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/pdfs/${fileName}`;
      console.log('✅ PDF generated with Puppeteer (rich formatting)');
    } catch (puppeteerError) {
      console.error('Puppeteer failed, falling back to pdfkit:', puppeteerError.message);
      usedFallback = true;
      // Fallback to pdfkit (plain text)
      await generatePdfWithPdfkit(notes, teacher.name, localPath);
      pdfUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/pdfs/${fileName}`;
    }

    // Save record
    await NotePDF.create({
      user: req.user.id,
      teacher: teacherId,
      pdfUrl: pdfUrl
    });

    res.json({ success: true, pdfUrl, fallback: usedFallback });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: error.message || 'PDF generation failed' });
  }
};