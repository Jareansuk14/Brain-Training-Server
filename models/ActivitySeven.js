const mongoose = require('mongoose');

const practiceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['family', 'work', 'social', 'leisure', 'health', 'spiritual'],
    required: true
  },
  dailyPractices: [practiceSchema],
  weeklyPractices: [practiceSchema],
  monthlyPractices: [practiceSchema],
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const activitySevenSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true
  },
  categories: [categorySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivitySeven', activitySevenSchema);