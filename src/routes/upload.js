const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// POST /api/upload/file — Upload file to Cloudinary
router.post('/file', authenticate, authorize('instructor', 'super_admin'), async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;
    
    const result = await cloudinary.uploader.upload(fileData, {
      resource_type: 'auto',
      public_id: `lms/${Date.now()}-${fileName || 'file'}`,
    });
    
    res.json({
      message: 'File uploaded',
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/upload/file/:publicId — Delete file from Cloudinary
router.delete('/file/:publicId', authenticate, authorize('instructor', 'super_admin'), async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
