const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, phone, bio, grade, preferredLanguage } = req.body;
    
    console.log('Updating profile for user:', req.user._id);
    console.log('Update data:', { fullName, phone, bio, grade, preferredLanguage });
    
    // Build update object
    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (phone !== undefined) updateFields.phone = phone;
    if (bio !== undefined) updateFields.bio = bio;
    
    // Handle nested profile fields
    if (grade !== undefined) updateFields['profile.grade'] = grade;
    if (preferredLanguage !== undefined) updateFields['profile.preferredLanguage'] = preferredLanguage;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Profile updated successfully:', user.email);
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        grade: user.profile?.grade,
        preferredLanguage: user.profile?.preferredLanguage,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      grade: user.profile?.grade,
      preferredLanguage: user.profile?.preferredLanguage,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;