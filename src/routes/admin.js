const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/admin/users — Get all users
router.get('/', authenticate, authorize('super_admin', 'institution_admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:id — Update user
router.put('/:id', authenticate, authorize('super_admin', 'institution_admin'), async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id — Delete user
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// PUT /api/admin/users/:id/reset-password — Admin resets user password
router.put('/:id/reset-password', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { password: hashedPassword } },
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/link-parent — Admin links parent to student
router.post('/link-parent', authenticate, authorize('super_admin', 'institution_admin'), async (req, res) => {
  try {
    const { parentEmail, studentEmail } = req.body;
    
    const parent = await User.findOne({ email: parentEmail, role: 'parent' });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    // Check already linked
    const alreadyLinked = parent.profile.linkedChildren.some(
      id => id.toString() === student._id.toString()
    );
    if (alreadyLinked) return res.status(400).json({ error: 'Already linked' });
    
    // Link both ways
    parent.profile.linkedChildren.push(student._id);
    await parent.save();
    
    res.json({ message: `${parent.fullName} linked to ${student.fullName}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/parent-links — Get all parent-student links
router.get('/parent-links', authenticate, authorize('super_admin', 'institution_admin'), async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent' })
      .select('fullName email profile.linkedChildren')
      .populate('profile.linkedChildren', 'fullName email profile.grade');
    
    res.json({ parents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
