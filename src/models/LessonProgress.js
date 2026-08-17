const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  completedAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });
lessonProgressSchema.index({ student: 1, course: 1 });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
