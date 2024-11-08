// server/models/MindMap.js
const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    },
    shape: {
        type: String,
        required: true,
        enum: ['rectangle', 'rounded', 'ellipse', 'diamond', 'hexagon', 'parallelogram', 'octagon']
    },
    color: {
        type: String,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    fontSize: {
        type: Number,
        required: true
    },
    fontColor: {
        type: String,
        required: true
    }
});

const connectionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    fromAnchor: {
        type: String,
        required: true,
        enum: ['top', 'right', 'bottom', 'left']
    },
    toAnchor: {
        type: String,
        required: true,
        enum: ['top', 'right', 'bottom', 'left']
    },
    type: {
        type: String,
        required: true,
        enum: ['straight', 'curved', 'angled']
    },
    color: {
        type: String,
        required: true
    }
});

const mindMapSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true,
        ref: 'User'
    },
    topics: [topicSchema],
    connections: [connectionSchema]
}, {
    timestamps: true
});

// Add index for faster queries
mindMapSchema.index({ nationalId: 1 });

const MindMap = mongoose.model('MindMap', mindMapSchema);
module.exports = MindMap;