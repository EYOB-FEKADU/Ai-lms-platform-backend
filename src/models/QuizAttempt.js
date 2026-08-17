const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  score: { type: Number, required: true },
  passingScore: { type: Number, required: true },
  passed: { type: Boolean, default: false },
  answers: [{
    questionId: mongoose.Schema.Types.ObjectId,
    userAnswer: String,
    isCorrect: Boolean,
    topicTags: [String],
  }],
  weakAreas: [String],
  attemptNumber: { type: Number, default: 1 },
}, { timestamps: true });

quizAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
