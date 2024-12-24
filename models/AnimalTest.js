const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  userAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number,  // เวลาที่ใช้ในการตอบคำถามนี้ (วินาที)
    required: true
  }
});

const sessionSchema = new mongoose.Schema({
  completedAt: {
    type: Date,
    default: Date.now
  },
  totalTime: {
    type: Number,  // เวลารวมทั้งหมด (วินาที)
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    default: 30
  },
  answers: [answerSchema]
});

const animalTestSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  sessions: [sessionSchema]
}, {
  timestamps: true
});

// Virtual field สำหรับการเปรียบเทียบผลระหว่างครั้งล่าสุด 2 ครั้ง
animalTestSchema.virtual('comparison').get(function() {
  if (this.sessions.length < 2) return null;

  const currentSession = this.sessions[this.sessions.length - 1];
  const previousSession = this.sessions[this.sessions.length - 2];

  return {
    totalTime: {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime
    },
    correctAnswers: {
      difference: currentSession.correctAnswers - previousSession.correctAnswers,
      improved: currentSession.correctAnswers > previousSession.correctAnswers
    },
    accuracy: {
      current: (currentSession.correctAnswers / currentSession.totalQuestions) * 100,
      previous: (previousSession.correctAnswers / previousSession.totalQuestions) * 100
    }
  };
});

module.exports = mongoose.model('AnimalTest', animalTestSchema);