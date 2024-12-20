// server/models/Goals.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['family', 'work', 'social', 'leisure', 'health', 'spiritual']
  },
  questions: [{
    questionId: String,
    question: String,
    answer: String
  }],
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const goalsSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true
  },
  answers: [answerSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Goals', goalsSchema);