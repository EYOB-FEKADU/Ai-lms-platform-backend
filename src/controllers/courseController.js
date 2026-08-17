const Course = require('../models/Course');
const User = require('../models/User');

// GET /api/courses — Browse all published courses
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, language, search, page = 1, limit = 12 } = req.query;
    
    const filter = { status: 'published' };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (language) filter.language = language;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(filter)
      .populate('instructor', 'fullName email')
      .select('-modules -enrolledStudents')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/courses/:id — Get single course details
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'fullName email bio')
      .populate({
        path: 'modules',
        select: 'title description order isPublished',
        options: { sort: { order: 1 } },
        populate: {
          path: 'lessons',
          select: 'title contentType content duration order isPublished aiPromptContext',
          options: { sort: { order: 1 } },
        },
      });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // If course is draft, only instructor or admin can view
    if (course.status === 'draft') {
      const isOwner = course.instructor._id.toString() === req.user?._id?.toString();
      const isAdmin = req.user?.role === 'super_admin' || req.user?.role === 'institution_admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Course not available' });
      }
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/courses — Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, language, thumbnail, duration } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      level,
      language,
      thumbnail,
      duration,
      instructor: req.user._id,
    });

    // Add course to instructor's profile
    await User.findByIdAndUpdate(req.user._id, {
      $push: { 'profile.specializations': category },
    });

    res.status(201).json({
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/courses/:id — Update course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Only the instructor who created it or admin can update
    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'institution_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    const allowedUpdates = ['title', 'description', 'category', 'level', 'language', 'thumbnail', 'duration'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/courses/:id — Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'institution_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/courses/:id/status — Change course status
exports.updateCourseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'super_admin' || req.user.role === 'institution_admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    course.status = status;
    await course.save();

    res.json({
      message: `Course ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'saved as draft'}`,
      course,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/courses/my — Instructor's own courses
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('instructor', 'fullName email')
      .sort({ updatedAt: -1 });

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};