const mongoose = require('mongoose');

const valueSchema = new mongoose.Schema({
    id: String,
    text: String,
    reason: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const planSchema = new mongoose.Schema({
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

const actionSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['value', 'goal', 'plan'],
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

const activityEightSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true,
        unique: true
    },
    values: [valueSchema],
    currentGoal: goalSchema,
    completedGoals: [goalSchema],
    actions: [actionSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('ActivityEight', activityEightSchema);
