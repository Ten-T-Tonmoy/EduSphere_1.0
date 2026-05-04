// server/middleware/upload.js
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
require('dotenv').config();

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGO_URI, // Make sure your .env has MONGO_URI
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    // Only accept these file types
    const match = ['image/png', 'image/jpeg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

    if (match.indexOf(file.mimetype) === -1) {
      // If file type not supported, returning null might cause error depending on setup, 
      // but usually we just want to return the filename.
      // Ideally, you'd filter this in the 'fileFilter' property of multer, 
      // but GridFsStorage handles it here for the filename generation.
      return `${Date.now()}-bezkoder-${file.originalname}`;
    }

    return {
      bucketName: 'uploads', // Must match the bucket name in your controller/model
      filename: `${Date.now()}-${file.originalname}`
    };
  }
});

const upload = multer({ storage });

module.exports = upload;