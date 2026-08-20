const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const LessonProgress = require('../models/LessonProgress');
const Lesson = require('../models/Lesson');

// POST /api/progress/mark-complete — Mark lesson as complete
router.post('/mark-complete', authenticate, authorize('student'), async (req, res) => {
  try {
    const { lessonId } = req.body;
    
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    
    let progress = await LessonProgress.findOne({
      student: req.user._id,
      lesson: lessonId,
    });
    
    if (progress) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.attempts += 1;
    } else {
      const Module = require('../models/Module');
      const moduleDoc = await Module.findById(lesson.module);
      const correctCourseId = moduleDoc ? moduleDoc.course : null;

      progress = await LessonProgress.create({
        student: req.user._id,
        lesson: lessonId,
        module: lesson.module,
        course: correctCourseId,
        status: 'completed',
        completedAt: new Date(),
      });
    }
    
    await progress.save();
    res.json({ message: 'Lesson marked complete', progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/progress/course/:courseId — Get progress for a course
router.get('/course/:courseId', authenticate, authorize('student'), async (req, res) => {
  try {
    const progress = await LessonProgress.find({
      student: req.user._id,
      course: req.params.courseId,
    }).select('lesson status completedAt');
    
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/progress/check-unlock/:lessonId — Check if lesson is unlocked
router.get('/check-unlock/:lessonId', authenticate, authorize('student'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    
    // Find the previous lesson in the module
    const Module = require('../models/Module');
    const module = await Module.findById(lesson.module);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    
    const lessonIndex = module.lessons.findIndex(
      l => l.toString() === lesson._id.toString()
    );
    
    if (lessonIndex === 0) {
      return res.json({ unlocked: true });
    }
    
    const previousLessonId = module.lessons[lessonIndex - 1];
    const previousProgress = await LessonProgress.findOne({
      student: req.user._id,
      lesson: previousLessonId,
      status: 'completed',
    });
    
    res.json({ unlocked: !!previousProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
