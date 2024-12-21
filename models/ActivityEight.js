const mongoose = require('mongoose');

const commitmentSchema = new mongoose.Schema({
  howToImprove: {
    type: String,
    required: true
  },
  obstacles: {
    type: String,
    required: true
  },
  handleObstacles: {
    type: String,
    required: true
  },
  supporters: {
    type: String,
    required: true
  },
  isAccepted: {
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
  commitment: commitmentSchema,
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const activityEightSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true
  },
  categories: [categorySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityEight', activityEightSchema);