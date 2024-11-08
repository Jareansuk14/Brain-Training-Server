// server/routes/emotion.js
const express = require('express');
const router = express.Router();
const Emotion = require('../models/Emotion');

// บันทึกอารมณ์
router.post('/save-emotion', async (req, res) => {
    try {
        const { nationalId, emotion, intensity, thoughts, color } = req.body;
        
        const newEmotion = new Emotion({
            nationalId,
            emotion,
            intensity,
            thoughts,
            color
        });

        await newEmotion.save();
        res.json({ 
            success: true, 
            message: 'บันทึกอารมณ์สำเร็จ',
            emotion: newEmotion 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ดึงประวัติอารมณ์ทั้งหมด
router.get('/history/:nationalId', async (req, res) => {
    try {
        const emotions = await Emotion.find({ 
            nationalId: req.params.nationalId 
        }).sort({ timestamp: -1 });
        
        res.json(emotions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ดึงประวัติอารมณ์ตามชนิดอารมณ์
router.get('/history/:nationalId/:emotion', async (req, res) => {
    try {
        const emotions = await Emotion.find({ 
            nationalId: req.params.nationalId,
            emotion: req.params.emotion 
        }).sort({ timestamp: -1 });
        
        res.json(emotions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;