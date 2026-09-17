// Router layer for audio upload and analysis endpoint

const express = require('express');
const multer = require('multer');
const path = require('path');
const audioController = require('../controllers/audioController');
const { MAX_AUDIO_SIZE_BYTES, SUPPORTED_EXTENSIONS } = require('../config/constants');

const router = express.Router();

// Multer memory storage configuration with 4.5 MB ceiling check (Vercel payload limit)
const upload = multer({
  limits: { fileSize: MAX_AUDIO_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(ext) || file.mimetype.startsWith('audio/') || file.mimetype.includes('video/webm')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format "${ext}". Please upload MP3, WAV, M4A, AAC, OGG, WEBM, or FLAC.`));
    }
  }
});

// Middleware for handling file upload errors cleanly
function handleUploadMiddleware(req, res, next) {
  upload.single('audio')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Audio file exceeds the 4.5 MB serverless host payload limit. Please select a smaller or compressed audio file.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// Route binding
router.post('/analyze', handleUploadMiddleware, audioController.analyzeAudio);

module.exports = router;
