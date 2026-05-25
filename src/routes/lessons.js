const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
} = require('../controllers/lessonController');

// All routes require authentication
router.use(authenticate);

// Get lessons for a module
router.get('/modules/:moduleId/lessons', getLessons);

// Get single lesson
router.get('/:id', getLesson);

// Create/Update/Delete (instructor/admin only)
router.post(
  '/modules/:moduleId/lessons',
  authorize('instructor', 'super_admin', 'institution_admin'),
  createLesson
);
router.put('/:id', authorize('instructor', 'super_admin', 'institution_admin'), updateLesson);
router.delete('/:id', authorize('instructor', 'super_admin', 'institution_admin'), deleteLesson);

module.exports = router;