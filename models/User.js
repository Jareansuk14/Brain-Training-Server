const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nationalId: {
        type: String,
        required: [true, 'กรุณากรอกหมายเลขผู้ใช้'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^[A-Za-z0-9]{6}$/.test(v);
            },
            message: 'รูปแบบหมายเลขผู้ใช้ไม่ถูกต้อง กรุณากรอกตัวอักษรภาษาอังกฤษหรือตัวเลขให้ครบ 6 ตัว'
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