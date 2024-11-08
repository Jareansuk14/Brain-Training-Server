const mongoose = require('mongoose');

const lifeDesignSchema = new mongoose.Schema({
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
    values: [{
        type: Number,
        required: [true, 'กรุณาเลือกคุณค่าที่สำคัญอย่างน้อย 1 ข้อ']
    }],
    goals: {
        workingMemory: {
            type: String,
            required: [true, 'กรุณากรอกเป้าหมายด้านความจำใช้งาน']
        },
        cognition: {
            type: String,
            required: [true, 'กรุณากรอกเป้าหมายด้านกระบวนการรู้คิด']
        },
        lifeBalance: {
            type: String,
            required: [true, 'กรุณากรอกเป้าหมายด้านความสมดุลในชีวิต']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // จะสร้าง createdAt และ updatedAt ให้อัตโนมัติ
});

const LifeDesign = mongoose.model('LifeDesign', lifeDesignSchema);
module.exports = LifeDesign;