const express = require('express');
const router = express.Router();
const multer = require('multer');
const noticeController = require('../controllers/noticeController');

// Using your project's Auth Middleware
const { auth } = require('../middleware/Auth'); 

// Set up Multer so Express can read the FormData and Attachments from React
const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'video/mp4', 'video/mpeg', 'video/quicktime',
      'application/zip', 'application/x-zip-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'), false);
    }
  }
});

// Protect all routes with auth
router.use(auth);

// Notice Routes pointing exactly to your noticeController.js
router.post('/', upload.array('attachments', 5), noticeController.createNotice);

// Support both URL styles just to be 100% safe!
router.get('/group/:groupId', noticeController.getGroupNotices);
router.get('/classroom/:groupId', noticeController.getGroupNotices); 

router.get('/unread/count', noticeController.getUnreadCount);
router.put('/:noticeId', upload.array('attachments', 5), noticeController.updateNotice);
router.delete('/:noticeId', noticeController.deleteNotice);
router.post('/:noticeId/view', noticeController.markAsViewed);
router.get('/file/:fileId', noticeController.getFile);

module.exports = router;