const Note = require('../models/Note');
const NotePDF = require('../models/NotePDF');
const User = require('../models/User'); 
const supabase = require('../config/supabase');
const fs = require('fs').promises;
const path = require('path');
const FirebaseService = require('../../notifications/services/firebase.service'); // ✅ Added Notification Service

let puppeteer;
try { puppeteer = require('puppeteer'); } catch (err) {}

let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch (err) {}

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

exports.getTeachersList = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isActive: true }).select('name email avatar');
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const userId = req.user._id || req.user.id;

    const myNotes = await Note.find({ 
      user: userId, 
      createdBy: teacherId 
    }).sort('-createdAt');

    const sharedNotes = await Note.find({
      createdBy: teacherId, 
      user: { $ne: userId }, 
      $or: [
        { sharedWith: userId }, 
        { sharedWith: { $size: 0 } } 
      ]
    }).populate('user', 'name').sort('-createdAt');

    const allNotes = [...myNotes, ...sharedNotes];

    res.json({ 
      success: true, 
      notes: allNotes, 
      isOwner: true 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { teacherId, content } = req.body;
    if (!teacherId || !content) {
      return res.status(400).json({ success: false, message: 'Teacher and content are required' });
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'unilife-uploads';
    const attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToSupabase(file, req.user._id || req.user.id, bucketName);
        attachments.push({
          fileName: file.originalname,
          fileUrl: uploadResult.publicUrl,
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    const note = await Note.create({
      user: req.user._id || req.user.id,
      createdBy: teacherId, 
      content,
      attachments,
      sharedWith: [] 
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.shareNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userIds } = req.body; 
    const userId = req.user._id || req.user.id;
    const note = await Note.findOne({ _id: noteId, user: userId });
    const sender = await User.findById(userId); // ✅ Fetch sender name for notification
    
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    if (userIds && userIds.length > 0) {
      note.sharedWith = [...new Set([...note.sharedWith, ...userIds])];
      
      // 🔔 TRIGGER PERSONAL NOTE NOTIFICATION
      try {
        await FirebaseService.sendToUsers(
          userIds,
          "Private Note Shared 📓",
          `${sender.name} shared a personal note with you!`,
          "/notes",
          "system",
          "normal",
          userId
        );
      } catch (err) {
        console.error("Firebase notification failed", err);
      }
    } else {
      note.sharedWith = []; 
    }
    
    await note.save();
    res.json({ success: true, message: 'Note shared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id || req.user.id });
    if (!note) return res.status(404).json({ success: false, message: 'You can only delete your own notes' });

    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generatePdfWithPuppeteer = async (htmlContent, outputPath) => {
  if (!puppeteer) throw new Error('Puppeteer not available');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
      const plainText = note.content.replace(/<[^>]*>/g, '');
      doc.fontSize(10).text(plainText, { align: 'left' });
      doc.moveDown();
      if (idx < notes.length - 1) doc.addPage();
    });
    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

exports.generateTeacherPDF = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { noteIds } = req.body;

    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    let query = { user: req.user._id || req.user.id, createdBy: teacherId };
    if (noteIds && noteIds.length > 0) query._id = { $in: noteIds };
    const notes = await Note.find(query).sort('createdAt');

    if (notes.length === 0) return res.status(400).json({ success: false, message: 'No notes to generate PDF' });

    const timestamp = Date.now();
    const fileName = `notes_${teacher.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    const pdfDir = path.join(__dirname, '../pdfs');
    await fs.mkdir(pdfDir, { recursive: true });
    const localPath = path.join(pdfDir, fileName);

    let pdfUrl;
    let usedFallback = false;

    try {
      const buildHTML = () => `<html><body><h1>Notes for ${teacher.name}</h1>${notes.map(n => `<div>${n.content}</div>`).join('')}</body></html>`;
      await generatePdfWithPuppeteer(buildHTML(), localPath);
      pdfUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/pdfs/${fileName}`;
    } catch (err) {
      usedFallback = true;
      await generatePdfWithPdfkit(notes, teacher.name, localPath);
      pdfUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/pdfs/${fileName}`;
    }

    await NotePDF.create({ user: req.user._id || req.user.id, teacher: teacherId, pdfUrl: pdfUrl });
    res.json({ success: true, pdfUrl, fallback: usedFallback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};