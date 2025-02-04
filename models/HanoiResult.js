// models/HanoiResult.js
import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  nationalId: {
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
    required: true
  },
  time: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('HanoiResult', resultSchema);