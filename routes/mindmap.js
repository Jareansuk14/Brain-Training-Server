// server/routes/mindmap.js
const express = require('express');
const router = express.Router();
const MindMap = require('../models/MindMap');

// Get mindmap for a user
router.get('/:nationalId', async (req, res) => {
    try {
        const mindmap = await MindMap.findOne({ nationalId: req.params.nationalId });
        if (!mindmap) {
            // Return empty mindmap if none exists
            return res.json({
                nationalId: req.params.nationalId,
                topics: [],
                connections: []
            });
        }
        res.json(mindmap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save or update mindmap
router.post('/save', async (req, res) => {
    try {
        const { nationalId, topics, connections } = req.body;

        // Validate required data
        if (!nationalId || !Array.isArray(topics)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // Find existing mindmap or create new one
        let mindmap = await MindMap.findOne({ nationalId });
        if (!mindmap) {
            mindmap = new MindMap({ nationalId });
        }

        // Update data
        mindmap.topics = topics;
        mindmap.connections = connections || [];

        await mindmap.save();
        res.json({ success: true, mindmap });
    } catch (error) {
        console.error('Save mindmap error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;