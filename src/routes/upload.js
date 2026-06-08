const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.md', '.docx', '.pptx', '.jpg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

// POST /api/upload/lesson-file — Upload file for a lesson
router.post('/lesson-file', authenticate, authorize('instructor', 'super_admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    res.json({
      message: 'File uploaded',
      file: {
        filename: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload/extract-text — Extract text from uploaded file
router.post('/extract-text', authenticate, authorize('instructor', 'super_admin'), async (req, res) => {
  try {
    const { filePath } = req.body;
    const fullPath = path.join(__dirname, '../../', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // For now, read text files directly. PDF support needs pdf-parse package.
    const ext = path.extname(fullPath).toLowerCase();
    let text = '';
    
    if (ext === '.txt' || ext === '.md') {
      text = fs.readFileSync(fullPath, 'utf-8');
    } else if (ext === '.pdf') {
      // Simple placeholder — in production use pdf-parse
      text = `[PDF Content from ${path.basename(fullPath)}]`;
    } else {
      text = `[Content from ${path.basename(fullPath)}]`;
    }
    
    res.json({ text, filename: path.basename(fullPath) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
