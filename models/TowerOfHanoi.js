const mongoose = require('mongoose');

// สร้าง Schema สำหรับแต่ละ Level
const levelResultSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true
  },
  moves: {
    type: Number,
    required: true
  },
  minMoves: {
    type: Number, // จำนวนการเคลื่อนย้ายน้อยที่สุดที่เป็นไปได้
    required: true
  },
  timeSpent: {
    type: Number, // เวลาที่ใช้ในแต่ละ level (วินาที)
    required: true
  },
  completed: {
    type: Boolean,
    required: true,
    default: false
  }
});

// สร้าง Schema สำหรับแต่ละ Session
const sessionSchema = new mongoose.Schema({
  completedAt: {
    type: Date,
    default: Date.now
  },
  totalTime: {
    type: Number, // เวลารวมทั้งหมด (วินาที)
    required: true
  },
  totalMoves: {
    type: Number, // จำนวนการเคลื่อนย้ายทั้งหมด
    required: true
  },
  levels: [levelResultSchema]
});

// สร้าง Schema หลัก
const towerOfHanoiSchema = new mongoose.Schema({
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
towerOfHanoiSchema.virtual('comparison').get(function() {
  if (this.sessions.length < 2) return null;

  const currentSession = this.sessions[this.sessions.length - 1];
  const previousSession = this.sessions[this.sessions.length - 2];

  return {
    totalTime: {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime
    },
    totalMoves: {
      difference: previousSession.totalMoves - currentSession.totalMoves,
      improved: currentSession.totalMoves < previousSession.totalMoves
    },
    levelComparisons: currentSession.levels.map((currentLevel, index) => {
      const previousLevel = previousSession.levels[index];
      if (!previousLevel) return null;

      return {
        level: currentLevel.level,
        timeImprovement: {
          difference: previousLevel.timeSpent - currentLevel.timeSpent,
          improved: currentLevel.timeSpent < previousLevel.timeSpent
        },
        movesImprovement: {
          difference: previousLevel.moves - currentLevel.moves,
          improved: currentLevel.moves < previousLevel.moves
        }
      };
    })
  };
});

module.exports = mongoose.model('TowerOfHanoi', towerOfHanoiSchema);