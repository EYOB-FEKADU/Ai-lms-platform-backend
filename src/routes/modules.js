const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} = require('../controllers/moduleController');

// All routes require authentication
router.use(authenticate);

// Get all modules for a course
router.get('/courses/:courseId/modules', getModules);

// Create a module (instructor/admin only)
router.post(
  '/courses/:courseId/modules',
  authorize('instructor', 'super_admin', 'institution_admin'),
  createModule
);

// Update/Delete/Reorder modules
router.put('/:id', authorize('instructor', 'super_admin', 'institution_admin'), updateModule);
router.delete('/:id', authorize('instructor', 'super_admin', 'institution_admin'), deleteModule);
router.put('/reorder', authorize('instructor', 'super_admin', 'institution_admin'), reorderModules);

module.exports = router;