const mongoose = require('mongoose');

// สร้าง Schema สำหรับแต่ละ Level
const levelResultSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true
  },
  digits: {
    type: [Number],
    required: true
  },
  userAnswer: {
    type: [Number],
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number,  // เวลาที่ใช้ในแต่ละ level (วินาที)
    required: true
  }
});

// สร้าง Schema สำหรับแต่ละ Mode (Forward/Backward)
const modeResultSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['forward', 'backward'],
    required: true
  },
  totalTime: {
    type: Number,  // เวลารวมของแต่ละโหมด (วินาที)
    required: true
  },
  levels: [levelResultSchema]
});

// สร้าง Schema สำหรับแต่ละ Session
const sessionSchema = new mongoose.Schema({
  completedAt: {
    type: Date,
    default: Date.now
  },
  totalTime: {
    type: Number,  // เวลารวมทั้งหมด (วินาที)
    required: true
  },
  forwardTime: {
    type: Number,  // เวลารวม forward mode (วินาที)
    required: true
  },
  backwardTime: {
    type: Number,  // เวลารวม backward mode (วินาที)
    required: true
  },
  modes: [modeResultSchema]
});

// สร้าง Schema หลัก
const digitSpanSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  sessions: [sessionSchema]
}, {
  timestamps: true
});

// เพิ่ม Virtual field สำหรับการเปรียบเทียบ
digitSpanSchema.virtual('comparison').get(function() {
  if (this.sessions.length < 2) return null;

  const currentSession = this.sessions[this.sessions.length - 1];
  const previousSession = this.sessions[this.sessions.length - 2];

  return {
    totalTime: {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime
    },
    forwardTime: {
      difference: previousSession.forwardTime - currentSession.forwardTime,
      improved: currentSession.forwardTime < previousSession.forwardTime
    },
    backwardTime: {
      difference: previousSession.backwardTime - currentSession.backwardTime,
      improved: currentSession.backwardTime < previousSession.backwardTime
    }
  };
});

module.exports = mongoose.model('DigitSpan', digitSpanSchema);