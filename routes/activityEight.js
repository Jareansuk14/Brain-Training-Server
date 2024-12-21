const express = require('express');
const router = express.Router();
const ActivityEight = require('../models/ActivityEight');

// ดึงข้อมูลของผู้ใช้
router.get('/:nationalId', async (req, res) => {
  try {
    const activityEight = await ActivityEight.findOne({
      nationalId: req.params.nationalId
    });
    res.json(activityEight || { categories: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// บันทึกข้อมูล
router.post('/save', async (req, res) => {
  try {
    const { 
      nationalId, 
      category, 
      howToImprove,
      obstacles,
      handleObstacles,
      supporters,
      isAccepted
    } = req.body;
    
    let activityEight = await ActivityEight.findOne({ nationalId });
    if (!activityEight) {
      activityEight = new ActivityEight({
        nationalId,
        categories: []
      });
    }

    const existingCategory = activityEight.categories.find(c => c.name === category);
    if (existingCategory) {
      // แทนที่ข้อมูลเก่าด้วยข้อมูลใหม่
      existingCategory.commitment = {
        howToImprove,
        obstacles,
        handleObstacles,
        supporters,
        isAccepted
      };
      existingCategory.lastModified = new Date();
    } else {
      activityEight.categories.push({
        name: category,
        commitment: {
          howToImprove,
          obstacles,
          handleObstacles,
          supporters,
          isAccepted
        },
        lastModified: new Date()
      });
    }

    await activityEight.save();
    res.json({ success: true, activityEight });
  } catch (error) {
    console.error('Error saving activity eight:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// อัพเดตสถานะการยอมรับพันธสัญญา
router.post('/toggle-acceptance', async (req, res) => {
  try {
    const { nationalId, category } = req.body;

    const activityEight = await ActivityEight.findOne({ nationalId });
    if (!activityEight) {
      return res.status(404).json({ error: 'Activity eight not found' });
    }

    const categoryData = activityEight.categories.find(c => c.name === category);
    if (!categoryData) {
      return res.status(404).json({ error: 'Category not found' });
    }

    categoryData.commitment.isAccepted = !categoryData.commitment.isAccepted;
    await activityEight.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;