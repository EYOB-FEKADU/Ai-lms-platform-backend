const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module is required'],
  },
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'quiz', 'assignment'],
    default: 'text',
  },
  content: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    default: null,
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
  order: {
    type: Number,
    required: [true, 'Lesson order is required'],
    min: 1,
  },
  resources: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'link', 'image', 'other'], default: 'other' },
  }],
  aiPromptContext: {
    type: String,
    default: '',
    maxlength: [2000, 'AI context cannot exceed 2000 characters'],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index: unique order per module
lessonSchema.index({ module: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);