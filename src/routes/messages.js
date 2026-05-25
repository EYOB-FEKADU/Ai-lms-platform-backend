const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const Course = require('../models/Course');
const User = require('../models/User');

// POST /api/messages — Send a message
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, courseId, subject, content } = req.body;
    
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      course: courseId || null,
      subject,
      content,
    });
    
    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/inbox — Get received messages
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ receiver: req.user._id })
      .populate('sender', 'fullName email role')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/sent — Get sent messages
router.get('/sent', authenticate, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .populate('receiver', 'fullName email role')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/messages/:id/read — Mark as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/instructor/:courseId/parent — Get instructor for a course (for parent)
router.get('/instructor/:courseId', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('instructor', 'fullName email');
    
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    res.json({ instructor: course.instructor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
