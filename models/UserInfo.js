// server/models/UserInfo.js
const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    unique: true
  },
  basicInfo: {
    fullName: String,
    nickname: String,
    bloodType: String,
    age: Number,
    birthDate: Date,
    favoriteColor: String,
    favoriteFoods: [String],
    dislikedFoods: [String],
    hobbies: [String],
    motto: String,
    personalTraits: [String]
  },
  deepQuestions: {
    happiness: String,
    longTermGoals: String,
    proudestMoment: String,
    biggestFear: String,
    strengthsWeaknesses: String,
    desiredChanges: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update lastUpdated
userInfoSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

const UserInfo = mongoose.model('UserInfo', userInfoSchema);
module.exports = UserInfo;
