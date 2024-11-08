// server/models/MeditationHistory.js
const mongoose = require('mongoose');

const meditationHistorySchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true,
        ref: 'User'
    },
    sessionNumber: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        enum: [5, 10, 15, 30]
    },
    notes: {
        type: String,
        required: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound index for nationalId and sessionNumber
meditationHistorySchema.index({ nationalId: 1, sessionNumber: 1 }, { unique: true });

// Static method to get the next session number for a user
meditationHistorySchema.statics.getNextSessionNumber = async function(nationalId) {
    const lastSession = await this.findOne({ nationalId }).sort({ sessionNumber: -1 });
    return lastSession ? lastSession.sessionNumber + 1 : 1;
};

const MeditationHistory = mongoose.model('MeditationHistory', meditationHistorySchema);
module.exports = MeditationHistory;