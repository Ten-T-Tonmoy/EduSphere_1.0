const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/Auth'); // <-- FIXED: Using your actual Auth middleware
const {
  getNotes,
  createNote,
  deleteNote,
  generateTeacherPDF,
  shareNote,
  getTeachersList
} = require('../controllers/noteController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images and PDFs'), false);
    }
  }
});

router.use(auth);

router.get('/teachers-list', getTeachersList); // <-- FIXED: Added route to fetch teachers safely
router.get('/teacher/:teacherId', getNotes);
router.post('/', upload.array('attachments', 5), createNote);
router.delete('/:id', deleteNote);
router.post('/teacher/:teacherId/generate-pdf', generateTeacherPDF);
router.post('/share/:noteId', shareNote);

module.exports = router;