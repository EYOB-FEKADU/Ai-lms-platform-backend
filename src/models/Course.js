const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  thumbnail: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Mathematics', 'Science', 'Language', 'Computer Science', 'History', 'Geography', 'Arts', 'Music', 'Other'],
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    enum: ['primary', 'middle_school', 'highschool', 'university', 'professional'],
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    enum: ['en', 'am', 'om'],
    default: 'en',
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required'],
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
  }],
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  duration: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalEnrollments: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Index for search and filtering
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, level: 1, language: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });

module.exports = mongoose.model('Course', courseSchema);