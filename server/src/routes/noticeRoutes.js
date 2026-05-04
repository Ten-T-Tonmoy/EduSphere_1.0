const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import the controller and auth middleware
const noticeController = require('../controllers/noticeController');
const { auth } = require('../middleware/Auth'); 

const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 }, 
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

// Notice Routes
router.post('/', upload.array('attachments', 5), noticeController.createNotice);

// THE FIX: Properly calling the updated getGroupNotices function
router.get('/group/:groupId', noticeController.getGroupNotices);

// Separated the jammed line
router.get('/unread/count', noticeController.getUnreadCount);

router.put('/:noticeId', upload.array('attachments', 5), noticeController.updateNotice);
router.delete('/:noticeId', noticeController.deleteNotice);
router.post('/:noticeId/view', noticeController.markAsViewed);
router.get('/file/:fileId', noticeController.getFile);

module.exports = router;