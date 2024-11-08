// routes/activityEight.js
const express = require('express');
const router = express.Router();
const ActivityEight = require('../models/ActivityEight');

// Get user's data
router.get('/:nationalId', async (req, res) => {
    try {
        const data = await ActivityEight.findOne({ nationalId: req.params.nationalId });
        res.json(data || { values: [], currentGoal: null, completedGoals: [], actions: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update values
router.post('/values/save', async (req, res) => {
    try {
        const { nationalId, values } = req.body;
        let activity = await ActivityEight.findOne({ nationalId });
        
        if (!activity) {
            activity = new ActivityEight({ nationalId });
        }

        // Record new values
        const newValues = values.filter(v => 
            !activity.values.find(existing => existing.id === v.id)
        );
        
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

// Delete value
router.post('/values/delete', async (req, res) => {
    try {
        const { nationalId, valueId } = req.body;
        const activity = await ActivityEight.findOne({ nationalId });
        
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const valueToDelete = activity.values.find(v => v.id === valueId);
        if (valueToDelete) {
            activity.actions.push({
                itemId: valueId,
                itemType: 'value',
                text: valueToDelete.text,
                action: 'delete'
            });

            activity.values = activity.values.filter(v => v.id !== valueId);
            await activity.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update current goal
router.post('/goal/save', async (req, res) => {
    try {
        const { nationalId, goal } = req.body;
        let activity = await ActivityEight.findOne({ nationalId });
        
        if (!activity) {
            activity = new ActivityEight({ nationalId });
        }

        // Check if this is a new goal or updating existing goal
        if (!activity.currentGoal) {
            // New goal
            activity.actions.push({
                itemId: goal.id,
                itemType: 'goal',
                text: goal.text,
                action: 'add'
            });
            activity.currentGoal = goal;
        } else {
            // Update existing goal
            if (goal.completed && !activity.currentGoal.completed) {
                activity.actions.push({
                    itemId: goal.id,
                    itemType: 'goal',
                    text: goal.text,
                    action: 'complete'
                });
                activity.completedGoals.push(goal);
                activity.currentGoal = null;
            } else {
                activity.currentGoal = goal;
            }
        }

        await activity.save();
        res.json({ success: true, activity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save/update plan
router.post('/plan/save', async (req, res) => {
    try {
        const { nationalId, plan } = req.body;
        let activity = await ActivityEight.findOne({ nationalId });
        
        if (!activity || !activity.currentGoal) {
            return res.status(400).json({ error: 'No active goal found' });
        }

        const existingPlanIndex = activity.currentGoal.plans.findIndex(p => p.id === plan.id);
        
        if (existingPlanIndex === -1) {
            // Add new plan
            activity.actions.push({
                itemId: plan.id,
                itemType: 'plan',
                text: plan.text,
                action: 'add'
            });
            activity.currentGoal.plans.push(plan);
        } else {
            // Update existing plan
            activity.currentGoal.plans[existingPlanIndex] = plan;
            if (plan.completed) {
                activity.actions.push({
                    itemId: plan.id,
                    itemType: 'plan',
                    text: plan.text,
                    action: 'complete'
                });
            }
        }

        await activity.save();
        res.json({ success: true, activity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete plan
router.post('/plan/delete', async (req, res) => {
    try {
        const { nationalId, planId } = req.body;
        const activity = await ActivityEight.findOne({ nationalId });
        
        if (!activity || !activity.currentGoal) {
            return res.status(404).json({ error: 'Activity or goal not found' });
        }

        const plan = activity.currentGoal.plans.find(p => p.id === planId);
        if (plan) {
            activity.actions.push({
                itemId: planId,
                itemType: 'plan',
                text: plan.text,
                action: 'delete'
            });

            activity.currentGoal.plans = activity.currentGoal.plans.filter(p => p.id !== planId);
            await activity.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get summary
router.get('/summary/:nationalId', async (req, res) => {
    try {
        const activity = await ActivityEight.findOne({ nationalId: req.params.nationalId });
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
                hasCurrentGoal: !!activity.currentGoal,
                completedGoalsCount: activity.completedGoals.length,
                currentGoalProgress: activity.currentGoal
                    ? activity.currentGoal.plans.filter(p => p.completed).length / 
                      activity.currentGoal.plans.length * 100
                    : 0
            }
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;