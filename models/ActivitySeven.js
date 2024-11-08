//server/models/ActivitySeven.js
const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['value', 'goal', 'plan', 'obstacle', 'commitment', 'reward'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['add', 'delete', 'complete', 'update'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const planSchema = new mongoose.Schema({
    id: String,
    text: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const goalSchema = new mongoose.Schema({
    id: String,
    text: String,
    completed: {
        type: Boolean,
        default: false
    },
    plans: [planSchema],
    obstacles: String,
    commitment: String,
    reward: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const activitySevenSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true
    },
    values: [{
        id: String,
        text: String,
        reason: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    goals: [goalSchema],
    actions: [actionSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('ActivitySeven', activitySevenSchema);