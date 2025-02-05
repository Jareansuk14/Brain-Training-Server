// models/TowerOfHanoi.js
const mongoose = require('mongoose');

const levelHistorySchema = new mongoose.Schema({
  completedAt: { 
    type: Date, 
    default: Date.now 
  },
  timeSpent: { 
    type: Number,
    required: true 
  },
  moves: { 
    type: Number,
    required: true 
  }
});

const levelStatsSchema = new mongoose.Schema({
  level: { 
    type: Number, 
    required: true 
  },
  bestTime: { 
    type: Number,
    required: true 
  },
  bestMoves: { 
    type: Number,
    required: true 
  },
  lastTime: { 
    type: Number,
    required: true 
  },
  lastMoves: { 
    type: Number,
    required: true 
  },
  lastPlayedAt: { 
    type: Date,
    default: Date.now 
  },
  history: [levelHistorySchema]
});

const towerOfHanoiSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  levelStats: [levelStatsSchema]
}, {
  timestamps: true
});

// Virtual สำหรับคำนวณจำนวนการเคลื่อนย้ายน้อยที่สุดที่เป็นไปได้
towerOfHanoiSchema.virtual('minMovesForLevel').get(function(level) {
  return Math.pow(2, level + 2) - 1;
});

module.exports = mongoose.model('TowerOfHanoi', towerOfHanoiSchema);
