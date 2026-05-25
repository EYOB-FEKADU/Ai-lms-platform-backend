const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// GET /api/parent/children — Get linked children
router.get('/children', authenticate, authorize('parent'), async (req, res) => {
  try {
    const parent = await User.findById(req.user._id)
      .populate({
        path: 'profile.linkedChildren',
        select: 'fullName email profile.grade profile.preferredLanguage'
      });

    res.json({ children: parent.profile.linkedChildren || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/parent/link-child — Link a child by email
router.post('/link-child', authenticate, authorize('parent'), async (req, res) => {
  try {
    const { childEmail } = req.body;
    
    // Find the child
    const child = await User.findOne({ email: childEmail, role: 'student' });
    if (!child) {
      return res.status(404).json({ error: 'Student not found with that email' });
    }

    // Check if already linked
    const parent = await User.findById(req.user._id);
    const alreadyLinked = parent.profile.linkedChildren.some(
      id => id.toString() === child._id.toString()
    );
    if (alreadyLinked) {
      return res.status(400).json({ error: 'Child already linked' });
    }

    // Link child to parent
    parent.profile.linkedChildren.push(child._id);
    await parent.save();

    res.json({ message: `${child.fullName} linked successfully`, child });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/parent/unlink-child/:childId — Unlink a child
router.delete('/unlink-child/:childId', authenticate, authorize('parent'), async (req, res) => {
  try {
    const parent = await User.findById(req.user._id);
    parent.profile.linkedChildren = parent.profile.linkedChildren.filter(
      id => id.toString() !== req.params.childId
    );
    await parent.save();

    res.json({ message: 'Child unlinked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/parent/child/:childId/progress — Get child's course progress
router.get('/child/:childId/progress', authenticate, authorize('parent'), async (req, res) => {
  try {
    // Verify parent is linked to this child
    const parent = await User.findById(req.user._id);
    const isLinked = parent.profile.linkedChildren.some(
      id => id.toString() === req.params.childId
    );
    if (!isLinked) {
      return res.status(403).json({ error: 'This child is not linked to your account' });
    }

    // Get child's enrollments
    const enrollments = await Enrollment.find({ student: req.params.childId })
      .populate('course', 'title description category');

    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
