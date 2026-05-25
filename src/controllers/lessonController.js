const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');

// Helper: Check if user can manage this lesson's course
const canManageLessonCourse = async (moduleId, userId, userRole) => {
  if (userRole === 'super_admin' || userRole === 'institution_admin') return true;
  const module = await Module.findById(moduleId);
  if (!module) return false;
  const course = await Course.findById(module.course);
  return course && course.instructor.toString() === userId.toString();
};

// GET /api/modules/:moduleId/lessons — Get all lessons for a module
exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ module: req.params.moduleId })
      .sort({ order: 1 });

    res.json({ lessons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/lessons/:id — Get single lesson
exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ lesson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/modules/:moduleId/lessons — Create a lesson
exports.createLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const authorized = await canManageLessonCourse(moduleId, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const lastLesson = await Lesson.findOne({ module: moduleId })
      .sort({ order: -1 });
    const order = lastLesson ? lastLesson.order + 1 : 1;

    const lesson = await Lesson.create({
      module: moduleId,
      title: req.body.title,
      contentType: req.body.contentType || 'text',
      content: req.body.content || '',
      videoUrl: req.body.videoUrl || null,
      duration: req.body.duration || 0,
      order,
      aiPromptContext: req.body.aiPromptContext || '',
    });

    await Module.findByIdAndUpdate(moduleId, {
      $push: { lessons: lesson._id },
    });

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/lessons/:id — Update a lesson
exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const authorized = await canManageLessonCourse(lesson.module, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowedFields = ['title', 'contentType', 'content', 'videoUrl', 'duration', 'aiPromptContext', 'isPublished'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lesson[field] = req.body[field];
      }
    });

    // Handle resources separately
    if (req.body.resources) {
      lesson.resources = req.body.resources;
    }

    await lesson.save();

    res.json({
      message: 'Lesson updated successfully',
      lesson,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/lessons/:id — Delete a lesson
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const authorized = await canManageLessonCourse(lesson.module, req.user._id, req.user.role);
    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Module.findByIdAndUpdate(lesson.module, {
      $pull: { lessons: lesson._id },
    });

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};