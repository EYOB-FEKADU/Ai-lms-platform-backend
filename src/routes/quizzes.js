const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Module = require('../models/Module');
const LessonProgress = require('../models/LessonProgress');

// GET /api/quizzes/module/:moduleId — Get quiz for a module
router.get('/module/:moduleId', authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ module: req.params.moduleId, isPublished: true });
    res.json({ quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes — Create quiz (instructor)
router.post('/', authenticate, authorize('instructor', 'super_admin'), async (req, res) => {
  try {
    const { moduleId, title, description, passingScore, timeLimit, questions } = req.body;
    
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ error: 'Module not found' });
    
    const quiz = await Quiz.create({
      module: moduleId,
      course: module.course,
      title,
      description,
      passingScore: passingScore || 60,
      timeLimit: timeLimit || 0,
      questions,
      isPublished: true,
    });
    
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quizzes/:quizId/submit — Submit quiz attempt
router.post('/:quizId/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    const { answers } = req.body; // [{ questionId, userAnswer }]
    
    // Check all module lessons are completed
    const moduleLessons = await Module.findById(quiz.module).select('lessons');
    const completedLessons = await LessonProgress.find({
      student: req.user._id,
      lesson: { $in: moduleLessons.lessons },
      status: 'completed',
    });
    
    if (completedLessons.length < moduleLessons.lessons.length) {
      return res.status(403).json({ error: 'Complete all lessons before taking the quiz' });
    }
    
    // Grade answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];
    const weakAreas = new Set();
    
    for (const answer of answers) {
      const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) continue;
      
      totalPoints += question.points;
      const isCorrect = answer.userAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
      
      if (isCorrect) {
        earnedPoints += question.points;
      } else {
        if (question.topicTags) {
          question.topicTags.forEach(tag => weakAreas.add(tag));
        }
      }
      
      gradedAnswers.push({
        questionId: question._id,
        userAnswer: answer.userAnswer,
        isCorrect,
        topicTags: question.topicTags || [],
      });
    }
    
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;
    
    // Get attempt number
    const previousAttempts = await QuizAttempt.countDocuments({
      student: req.user._id,
      quiz: quiz._id,
    });
    
    const attempt = await QuizAttempt.create({
      student: req.user._id,
      quiz: quiz._id,
      module: quiz.module,
      course: quiz.course,
      score,
      passingScore: quiz.passingScore,
      passed,
      answers: gradedAnswers,
      weakAreas: [...weakAreas],
      attemptNumber: previousAttempts + 1,
    });
    
    res.json({
      message: passed ? 'Quiz passed! Next module unlocked.' : 'Quiz not passed. Review weak areas and try again.',
      score,
      passed,
      weakAreas: [...weakAreas],
      attemptNumber: attempt.attemptNumber,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quizzes/student-progress — Get weak areas for AI
router.get('/student-progress', authenticate, authorize('student'), async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const weakAreas = {};
    for (const attempt of attempts) {
      for (const area of attempt.weakAreas) {
        weakAreas[area] = (weakAreas[area] || 0) + 1;
      }
    }
    
    res.json({ weakAreas, attempts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
