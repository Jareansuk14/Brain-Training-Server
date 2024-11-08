// server/models/Goals.js
const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['value', 'shortTermGoal', 'longTermGoal'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['add', 'delete', 'complete'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const goalsSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true
    },
    values: [{
        id: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    shortTermGoals: [{
        id: String,
        text: String,
        completed: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    longTermGoals: [{
        id: String,
        text: String,
        completed: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    actions: [actionSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Goals', goalsSchema);