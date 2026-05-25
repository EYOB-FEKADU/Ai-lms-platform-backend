const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  getMyCourses,
} = require('../controllers/courseController');

// Public routes (authenticated users)
router.get('/', authenticate, getAllCourses);
router.get('/my', authenticate, authorize('instructor', 'super_admin', 'institution_admin'), getMyCourses);
router.get('/:id', authenticate, getCourse);

// Instructor/Admin routes
router.post('/', authenticate, authorize('instructor', 'super_admin', 'institution_admin'), createCourse);
router.put('/:id', authenticate, authorize('instructor', 'super_admin', 'institution_admin'), updateCourse);
router.delete('/:id', authenticate, authorize('instructor', 'super_admin', 'institution_admin'), deleteCourse);
router.patch('/:id/status', authenticate, authorize('instructor', 'super_admin', 'institution_admin'), updateCourseStatus);

module.exports = router;