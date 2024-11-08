const express = require('express');
const router = express.Router();
const LifeDesign = require('../models/LifeDesign');

// Get all active life designs for a user
router.get('/:nationalId', async (req, res) => {
    try {
        const plans = await LifeDesign.find({ 
            nationalId: req.params.nationalId,
            isActive: true 
        }).sort('-createdAt');
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific life design details
router.get('/detail/:id', async (req, res) => {
    try {
        const plan = await LifeDesign.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ error: 'แผนเป้าหมายไม่พบ' });
        }
        res.json(plan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new life design plan
router.post('/create', async (req, res) => {
    try {
        const { nationalId, values, goals } = req.body;

        // Validate required fields
        if (!values || !values.length) {
            return res.status(400).json({ error: 'กรุณาเลือกคุณค่าที่สำคัญอย่างน้อย 1 ข้อ' });
        }
        if (!goals || !goals.workingMemory || !goals.cognition || !goals.lifeBalance) {
            return res.status(400).json({ error: 'กรุณากรอกเป้าหมายให้ครบทุกด้าน' });
        }

        const newPlan = new LifeDesign({
            nationalId,
            values,
            goals
        });

        await newPlan.save();
        res.json({
            success: true,
            message: 'สร้างแผนเป้าหมายสำเร็จ',
            plan: newPlan
        });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(400).json({ 
            error: error.message || 'เกิดข้อผิดพลาดในการสร้างแผนเป้าหมาย'
        });
    }
});

// Delete life design plan (soft delete)
router.put('/delete/:id', async (req, res) => {
    try {
        const plan = await LifeDesign.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ error: 'แผนเป้าหมายไม่พบ' });
        }

        plan.isActive = false;
        await plan.save();

        res.json({
            success: true,
            message: 'ลบแผนเป้าหมายสำเร็จ'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user has any existing plans
router.get('/check/:nationalId', async (req, res) => {
    try {
        const existingPlans = await LifeDesign.find({
            nationalId: req.params.nationalId,
            isActive: true
        }).countDocuments();

        res.json({
            hasExistingPlans: existingPlans > 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get latest plan
router.get('/latest/:nationalId', async (req, res) => {
    try {
        const latestPlan = await LifeDesign.findOne({
            nationalId: req.params.nationalId,
            isActive: true
        }).sort('-createdAt');

        if (!latestPlan) {
            return res.status(404).json({ error: 'ไม่พบแผนเป้าหมาย' });
        }

        res.json(latestPlan);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;