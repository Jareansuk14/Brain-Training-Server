// server/models/Emotion.js
const mongoose = require('mongoose');

const emotionSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true
  },
  entries: [{
    // Situation section
    situation: {
      forgetfulEvents: {
        type: String,
        required: true
      },
      eventImportance: {
        type: String,
        required: true
      },
      forgetfulReasons: {
        type: String,
        required: true
      }
    },
    // Physical awareness section
    physicalAwareness: {
      bodySymptoms: {
        type: String,
        required: true
      },
      breathingChanges: {
        type: String,
        required: true
      },
      bodyTension: {
        type: String,
        required: true
      }
    },
    // Emotions section
    emotions: [{
      type: String,
      enum: ['Joy', 'Trust', 'Fear', 'Surprise', 'Sadness', 'Disgust', 'Anger', 'Anticipation']
    }],
    // Emotion-specific questions
    emotionResponses: [{
      emotion: {
        type: String,
        required: true
      },
      answers: [{
        questionId: String,
        question: String,
        answer: String
      }]
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Emotion', emotionSchema);
