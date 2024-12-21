const express = require('express');
const router = express.Router();
const ActivitySeven = require('../models/ActivitySeven');

// ดึงข้อมูลของผู้ใช้
router.get('/:nationalId', async (req, res) => {
  try {
    const activitySeven = await ActivitySeven.findOne({
      nationalId: req.params.nationalId
    });
    res.json(activitySeven || { categories: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// บันทึกข้อมูล
router.post('/save', async (req, res) => {
  try {
    const { nationalId, category, dailyPractice, weeklyPractice, monthlyPractice } = req.body;
    
    let activitySeven = await ActivitySeven.findOne({ nationalId });
    if (!activitySeven) {
      activitySeven = new ActivitySeven({
        nationalId,
        categories: []
      });
    }

    const existingCategory = activitySeven.categories.find(c => c.name === category);
    if (existingCategory) {
      // แทนที่ข้อมูลเก่าด้วยข้อมูลใหม่
      existingCategory.dailyPractices = [{
        type: 'daily',
        text: dailyPractice.text
      }];
      existingCategory.weeklyPractices = [{
        type: 'weekly',
        text: weeklyPractice.text
      }];
      existingCategory.monthlyPractices = [{
        type: 'monthly',
        text: monthlyPractice.text
      }];
      existingCategory.lastModified = new Date();
    } else {
      activitySeven.categories.push({
        name: category,
        dailyPractices: [{
          type: 'daily',
          text: dailyPractice.text
        }],
        weeklyPractices: [{
          type: 'weekly',
          text: weeklyPractice.text
        }],
        monthlyPractices: [{
          type: 'monthly',
          text: monthlyPractice.text
        }],
        lastModified: new Date()
      });
    }

    await activitySeven.save();
    res.json({ success: true, activitySeven });
  } catch (error) {
    console.error('Error saving activity seven:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// อัพเดตสถานะการทำเสร็จ
router.post('/toggle-practice', async (req, res) => {
  try {
    const { nationalId, category, type, practiceId } = req.body;

    const activitySeven = await ActivitySeven.findOne({ nationalId });
    if (!activitySeven) {
      return res.status(404).json({ error: 'Activity seven not found' });
    }

    const categoryData = activitySeven.categories.find(c => c.name === category);
    if (!categoryData) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let practices;
    switch (type) {
      case 'daily':
        practices = categoryData.dailyPractices;
        break;
      case 'weekly':
        practices = categoryData.weeklyPractices;
        break;
      case 'monthly':
        practices = categoryData.monthlyPractices;
        break;
      default:
        return res.status(400).json({ error: 'Invalid practice type' });
    }

    const practiceIndex = practices.findIndex(p => p._id.toString() === practiceId);
    if (practiceIndex === -1) {
      return res.status(404).json({ error: 'Practice not found' });
    }

    practices[practiceIndex].completed = !practices[practiceIndex].completed;
    await activitySeven.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;