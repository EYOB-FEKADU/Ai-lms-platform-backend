const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  order: {
    type: Number,
    required: [true, 'Module order is required'],
    min: 1,
  },
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
  }],
  isPublished: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index: unique order per course
moduleSchema.index({ course: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Module', moduleSchema);