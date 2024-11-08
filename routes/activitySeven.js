//server/routes/activitySeven.js
const express = require('express');
const router = express.Router();
const ActivitySeven = require('../models/ActivitySeven');

// Get user's data
router.get('/:nationalId', async (req, res) => {
    try {
        const data = await ActivitySeven.findOne({ nationalId: req.params.nationalId });
        res.json(data || { values: [], goals: [], actions: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update values
router.post('/values/save', async (req, res) => {
    try {
        const { nationalId, values } = req.body;
        let activity = await ActivitySeven.findOne({ nationalId });
        
        if (!activity) {
            activity = new ActivitySeven({ nationalId });
        }

        // Record new values
        const newValues = values.filter(v => !activity.values.find(existing => existing.id === v.id));
        newValues.forEach(value => {
            activity.actions.push({
                itemId: value.id,
                itemType: 'value',
                text: value.text,
                action: 'add'
            });
        });
        
        activity.values = values;
        await activity.save();
        res.json({ success: true, activity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update goals and related data
router.post('/goals/save', async (req, res) => {
    try {
        const { nationalId, goals } = req.body;
        let activity = await ActivitySeven.findOne({ nationalId });
        
        if (!activity) {
            activity = new ActivitySeven({ nationalId });
        }

        // Record new goals and updates
        goals.forEach(goal => {
            const existingGoal = activity.goals.find(g => g.id === goal.id);
            if (!existingGoal) {
                activity.actions.push({
                    itemId: goal.id,
                    itemType: 'goal',
                    text: goal.text,
                    action: 'add'
                });
            } else if (goal.completed !== existingGoal.completed) {
                activity.actions.push({
                    itemId: goal.id,
                    itemType: 'goal',
                    text: goal.text,
                    action: goal.completed ? 'complete' : 'update'
                });
            }
        });
        
        activity.goals = goals;
        await activity.save();
        res.json({ success: true, activity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete items (values, goals, plans)
router.post('/delete', async (req, res) => {
    try {
        const { nationalId, itemId, itemType, text } = req.body;
        const activity = await ActivitySeven.findOne({ nationalId });
        
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        activity.actions.push({
            itemId,
            itemType,
            text,
            action: 'delete'
        });

        // Remove the item based on type
        if (itemType === 'value') {
            activity.values = activity.values.filter(v => v.id !== itemId);
        } else if (itemType === 'goal') {
            activity.goals = activity.goals.filter(g => g.id !== itemId);
        } else if (itemType === 'plan') {
            activity.goals = activity.goals.map(goal => ({
                ...goal,
                plans: goal.plans.filter(p => p.id !== itemId)
            }));
        }

        await activity.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get summary of all actions
router.get('/summary/:nationalId', async (req, res) => {
    try {
        const activity = await ActivitySeven.findOne({ nationalId: req.params.nationalId });
        if (!activity) {
            return res.json({ actions: [] });
        }

        const summary = {
            actions: activity.actions.map(action => ({
                ...action.toObject(),
                timestamp: action.timestamp
            })),
            statistics: {
                totalValues: activity.values.length,
                totalGoals: activity.goals.length,
                completedGoals: activity.goals.filter(g => g.completed).length,
            }
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;