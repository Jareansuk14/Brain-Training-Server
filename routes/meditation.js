// server/routes/meditation.js
const express = require('express');
const router = express.Router();
const MeditationHistory = require('../models/MeditationHistory');

// Get meditation history for a user
router.get('/history/:nationalId', async (req, res) => {
    try {
        const history = await MeditationHistory.find({ 
            nationalId: req.params.nationalId 
        }).sort({ sessionNumber: 1 });
        
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save meditation session
router.post('/save-session', async (req, res) => {
    try {
        const { nationalId, duration, notes } = req.body;
        
        // Get next session number
        const sessionNumber = await MeditationHistory.getNextSessionNumber(nationalId);
        
        // Create new meditation history entry
        const session = new MeditationHistory({
            nationalId,
            sessionNumber,
            duration,
            notes
        });
        
        await session.save();
        
        res.json({ 
            success: true, 
            message: 'Meditation session saved successfully',
            session 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;