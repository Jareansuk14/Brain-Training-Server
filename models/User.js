// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: [true, 'กรุณากรอกเลขบัตรประชาชน'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{13}$/.test(v);
            },
            message: 'รูปแบบเลขบัตรประชาชนไม่ถูกต้อง'
        }
    },
    basicInfo: {
        type: Object,
        default: null
    },
    deepQuestions: {
        type: Object,
        default: null
    }
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = mongoose.model('User', userSchema);