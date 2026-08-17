const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'], required: true },
  question: { type: String, required: true },
  options: [String],
  correctAnswer: { type: String },
  explanation: { type: String, default: '' },
  points: { type: Number, default: 1 },
  topicTags: [String],
});

const quizSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  passingScore: { type: Number, default: 60, min: 0, max: 100 },
  timeLimit: { type: Number, default: 0 }, // minutes, 0 = no limit
  questions: [questionSchema],
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

quizSchema.index({ module: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
