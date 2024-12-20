// server/routes/lifeDesign.js
const express = require('express');
const router = express.Router();
const LifeDesign = require('../models/LifeDesign');

// Get user's life design data
router.get('/:nationalId', async (req, res) => {
  try {
    const lifeDesign = await LifeDesign.findOne({ nationalId: req.params.nationalId });
    res.json(lifeDesign || { categories: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save goals for a category
router.post('/save', async (req, res) => {
  try {
    const { nationalId, category, type, goals } = req.body;
    
    let lifeDesign = await LifeDesign.findOne({ nationalId });
    if (!lifeDesign) {
      lifeDesign = new LifeDesign({ 
        nationalId,
        categories: []
      });
    }

    const categoryIndex = lifeDesign.categories.findIndex(c => c.name === category);
    if (categoryIndex >= 0) {
      if (type === 'short') {
        lifeDesign.categories[categoryIndex].shortTermGoals = goals;
      } else {
        lifeDesign.categories[categoryIndex].longTermGoals = goals;
      }
      lifeDesign.categories[categoryIndex].lastModified = new Date();
    } else {
      const newCategory = {
        name: category,
        shortTermGoals: type === 'short' ? goals : [],
        longTermGoals: type === 'long' ? goals : [],
        lastModified: new Date()
      };
      lifeDesign.categories.push(newCategory);
    }

    await lifeDesign.save();
    res.json({ success: true, lifeDesign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle goal completion status
router.post('/toggle-goal', async (req, res) => {
  try {
    const { nationalId, category, type, goalId } = req.body;
    
    const lifeDesign = await LifeDesign.findOne({ nationalId });
    if (!lifeDesign) {
      return res.status(404).json({ error: 'Life design not found' });
    }

    const categoryData = lifeDesign.categories.find(c => c.name === category);
    if (!categoryData) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const goals = type === 'short' ? categoryData.shortTermGoals : categoryData.longTermGoals;
    const goalIndex = goals.findIndex(g => g._id.toString() === goalId);
    
    if (goalIndex === -1) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    goals[goalIndex].completed = !goals[goalIndex].completed;
    await lifeDesign.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;