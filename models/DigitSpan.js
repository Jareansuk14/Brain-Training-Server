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
  attemptsUsed: {
    type: Number,
    default: 0
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
  successRate: {
    type: Number,  // อัตราการตอบถูก (%)
    default: 0
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
    default: 0
  },
  backwardTime: {
    type: Number,  // เวลารวม backward mode (วินาที)
    default: 0
  },
  successRate: {
    type: Number,  // อัตราการตอบถูกรวม (%)
    default: 0
  },
  forwardSuccessRate: {
    type: Number,  // อัตราการตอบถูก Forward (%)
    default: 0
  },
  backwardSuccessRate: {
    type: Number,  // อัตราการตอบถูก Backward (%)
    default: 0
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
  
  // เช็คว่าเล่นโหมดไหน
  const playingForward = currentSession.forwardTime > 0;
  const playingBackward = currentSession.backwardTime > 0;
  
  // สร้างข้อมูลเปรียบเทียบตามโหมดที่เล่น
  const comparison = {};
  
  if (playingForward && previousSession.forwardTime > 0) {
    comparison.forwardTime = {
      difference: previousSession.forwardTime - currentSession.forwardTime,
      improved: currentSession.forwardTime < previousSession.forwardTime
    };
    comparison.forwardSuccessRate = {
      difference: currentSession.forwardSuccessRate - previousSession.forwardSuccessRate,
      improved: currentSession.forwardSuccessRate > previousSession.forwardSuccessRate
    };
  }
  
  if (playingBackward && previousSession.backwardTime > 0) {
    comparison.backwardTime = {
      difference: previousSession.backwardTime - currentSession.backwardTime,
      improved: currentSession.backwardTime < previousSession.backwardTime
    };
    comparison.backwardSuccessRate = {
      difference: currentSession.backwardSuccessRate - previousSession.backwardSuccessRate,
      improved: currentSession.backwardSuccessRate > previousSession.backwardSuccessRate
    };
  }
  
  // เพิ่มการเปรียบเทียบเวลาและอัตราความถูกต้องรวม
  if (currentSession.totalTime > 0 && previousSession.totalTime > 0) {
    comparison.totalTime = {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime
    };
  }
  
  if (currentSession.successRate > 0 && previousSession.successRate > 0) {
    comparison.successRate = {
      difference: currentSession.successRate - previousSession.successRate,
      improved: currentSession.successRate > previousSession.successRate
    };
  }
  
  return comparison;
});

// แปลง Virtual fields เป็น JSON
digitSpanSchema.set('toJSON', { virtuals: true });
digitSpanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DigitSpan', digitSpanSchema);