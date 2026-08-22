const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://172.18.0.1:8000';

// POST /api/tutor/ask — Proxy to AI Tutor service
router.post('/ask', authenticate, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout
    const response = await fetch(`${AI_SERVICE_URL}/tutor/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'AI Tutor service unavailable. Is it running on port 8000?' });
  }
});

module.exports = router;

// POST /api/tutor/index-course — Index course content for RAG
router.post('/index-course', authenticate, async (req, res) => {
  try {
    const { courseId, content } = req.body;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout
    const response = await fetch(`${AI_SERVICE_URL}/tutor/index-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, content }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to index course content' });
  }
});

// Import ChatHistory model
const ChatHistory = require('../models/ChatHistory');

// GET /api/tutor/history/:courseId — Get chat history for a course
router.get('/history/:courseId', authenticate, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({
      student: req.user._id,
      course: req.params.courseId
    });
    res.json({ messages: history?.messages || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tutor/save-message — Save a message to chat history
router.post('/save-message', authenticate, async (req, res) => {
  try {
    const { courseId, role, content } = req.body;
    
    let history = await ChatHistory.findOne({
      student: req.user._id,
      course: courseId
    });
    
    if (!history) {
      history = await ChatHistory.create({
        student: req.user._id,
        course: courseId,
        messages: []
      });
    }
    
    history.messages.push({ role, content, timestamp: new Date() });
    await history.save();
    
    res.json({ message: 'Saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
