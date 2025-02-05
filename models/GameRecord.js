// models/GameRecord.js
const mongoose = require('mongoose');

const gameRecordSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  moves: {
    type: Number,
    required: true,
    min: 0
  },
  timeSpent: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  completed: {
    type: Boolean,
    required: true,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
gameRecordSchema.index({ userId: 1, level: 1, timestamp: -1 });

module.exports = mongoose.model('GameRecord', gameRecordSchema);
