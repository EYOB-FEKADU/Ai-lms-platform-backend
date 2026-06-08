const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

chatHistorySchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
