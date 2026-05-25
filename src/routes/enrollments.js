const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  enrollCourse,
  unenrollCourse,
  getMyEnrolledCourses,
  updateProgress,
  getInstructorStudents,
} = require('../controllers/enrollmentController');

// All routes require authentication
router.use(authenticate);

// Student routes
router.get('/my-enrolled', getMyEnrolledCourses);
router.post('/courses/:id/enroll', authorize('student'), enrollCourse);
router.delete('/courses/:id/unenroll', authorize('student'), unenrollCourse);

// Progress tracking
router.patch('/:id/progress', authorize('student'), updateProgress);

// Instructor routes
router.get(
  '/instructor/students',
  authorize('instructor', 'super_admin', 'institution_admin'),
  getInstructorStudents
);

module.exports = router;