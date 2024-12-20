// server/models/LifeDesign.js
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['short', 'long'],
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
  shortTermGoals: [goalSchema],
  longTermGoals: [goalSchema],
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const lifeDesignSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true
  },
  categories: [categorySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('LifeDesign', lifeDesignSchema);