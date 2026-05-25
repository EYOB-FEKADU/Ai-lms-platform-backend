const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// POST /api/courses/:id/enroll — Enroll in a course
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.status !== 'published') {
      return res.status(400).json({ error: 'Cannot enroll in an unpublished course' });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.id,
    });

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: req.params.id,
    });

    // Update course
    await Course.findByIdAndUpdate(req.params.id, {
      $push: { enrolledStudents: req.user._id },
      $inc: { totalEnrollments: 1 },
    });

    res.status(201).json({
      message: 'Successfully enrolled',
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/courses/:id/unenroll — Unenroll from a course
exports.unenrollCourse = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndDelete({
      student: req.user._id,
      course: req.params.id,
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Not enrolled in this course' });
    }

    await Course.findByIdAndUpdate(req.params.id, {
      $pull: { enrolledStudents: req.user._id },
      $inc: { totalEnrollments: -1 },
    });

    res.json({ message: 'Successfully unenrolled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/courses/my-enrolled — Student's enrolled courses
exports.getMyEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'fullName email',
        },
      })
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/enrollments/:id/progress — Update progress
exports.updateProgress = async (req, res) => {
  try {
    const { lessonId, progress } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your enrollment' });
    }

    // Mark lesson as completed
    if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Update progress percentage
    if (progress !== undefined) {
      enrollment.progress = progress;
    }

    // Check if course completed
    if (enrollment.progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.json({
      message: 'Progress updated',
      enrollment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/instructor/students — Get students for instructor's courses
exports.getInstructorStudents = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map(c => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('student', 'fullName email')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 });

    res.json({ enrollments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};