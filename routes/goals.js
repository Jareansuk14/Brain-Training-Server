// server/routes/goals.js
const express = require('express');
const router = express.Router();
const Goals = require('../models/Goals');

// Get user's answers
router.get('/:nationalId', async (req, res) => {
  try {
    const goals = await Goals.findOne({ nationalId: req.params.nationalId });
    res.json(goals || { answers: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save/update answers
router.post('/save', async (req, res) => {
  try {
    const { nationalId, category, questions } = req.body;
    
    let goals = await Goals.findOne({ nationalId });
    if (!goals) {
      goals = new Goals({ nationalId, answers: [] });
    }

    const existingCategoryIndex = goals.answers.findIndex(a => a.category === category);
    if (existingCategoryIndex >= 0) {
      goals.answers[existingCategoryIndex].questions = questions;
      goals.answers[existingCategoryIndex].lastModified = new Date();
    } else {
      goals.answers.push({ category, questions, lastModified: new Date() });
    }

    await goals.save();
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;