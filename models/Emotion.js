// server/models/Emotion.js
const mongoose = require('mongoose');

const emotionSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{13}$/.test(v);
            },
            message: props => `${props.value} is not a valid national ID!`
        }
    },
    emotion: {
        type: String,
        required: [true, 'กรุณาระบุอารมณ์']
    },
    intensity: {
        type: Number,
        required: [true, 'กรุณาระบุระดับความเข้มข้น'],
        min: 1,
        max: 10
    },
    thoughts: {
        type: String,
        required: [true, 'กรุณาบันทึกความคิด']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    color: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Emotion = mongoose.model('Emotion', emotionSchema);
module.exports = Emotion;