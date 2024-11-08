// server/routes/goals.js
const express = require('express');
const router = express.Router();
const Goals = require('../models/Goals');

// Get user's goals and values
router.get('/:nationalId', async (req, res) => {
    try {
        const goals = await Goals.findOne({ nationalId: req.params.nationalId });
        res.json(goals || { values: [], shortTermGoals: [], longTermGoals: [], actions: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update goals and values
router.post('/save', async (req, res) => {
    try {
        const { nationalId, values, shortTermGoals, longTermGoals } = req.body;
        
        let goals = await Goals.findOne({ nationalId });
        
        if (!goals) {
            goals = new Goals({ nationalId });
        }

        // Add new items and record actions
        if (values) {
            const newValues = values.filter(v => !goals.values.find(existing => existing.id === v.id));
            newValues.forEach(value => {
                goals.actions.push({
                    itemId: value.id,
                    itemType: 'value',
                    text: value.text,
                    action: 'add'
                });
            });
            goals.values = values;
        }

        if (shortTermGoals) {
            const newGoals = shortTermGoals.filter(g => !goals.shortTermGoals.find(existing => existing.id === g.id));
            newGoals.forEach(goal => {
                goals.actions.push({
                    itemId: goal.id,
                    itemType: 'shortTermGoal',
                    text: goal.text,
                    action: 'add'
                });
            });
            goals.shortTermGoals = shortTermGoals;
        }

        if (longTermGoals) {
            const newGoals = longTermGoals.filter(g => !goals.longTermGoals.find(existing => existing.id === g.id));
            newGoals.forEach(goal => {
                goals.actions.push({
                    itemId: goal.id,
                    itemType: 'longTermGoal',
                    text: goal.text,
                    action: 'add'
                });
            });
            goals.longTermGoals = longTermGoals;
        }

        await goals.save();
        res.json({ success: true, goals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record item deletion
router.post('/delete', async (req, res) => {
    try {
        const { nationalId, itemId, itemType, text } = req.body;
        
        const goals = await Goals.findOne({ nationalId });
        if (!goals) {
            return res.status(404).json({ error: 'Goals not found' });
        }

        goals.actions.push({
            itemId,
            itemType,
            text,
            action: 'delete'
        });

        await goals.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record goal completion
router.post('/complete', async (req, res) => {
    try {
        const { nationalId, itemId, itemType, text } = req.body;
        
        const goals = await Goals.findOne({ nationalId });
        if (!goals) {
            return res.status(404).json({ error: 'Goals not found' });
        }

        goals.actions.push({
            itemId,
            itemType,
            text,
            action: 'complete'
        });

        await goals.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get activity summary
router.get('/summary/:nationalId', async (req, res) => {
    try {
        const goals = await Goals.findOne({ nationalId: req.params.nationalId });
        if (!goals) {
            return res.json({ actions: [] });
        }

        const summary = goals.actions.map(action => ({
            text: action.text,
            action: action.action,
            itemType: action.itemType,
            timestamp: action.timestamp
        }));

        res.json({ actions: summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;