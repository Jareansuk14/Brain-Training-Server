const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Login
router.post('/login', async (req, res) => {
  try {
    const { nationalId } = req.body;
    
    // Validate user ID format
    if (!/^[A-Za-z0-9]{1,6}$/.test(nationalId)) {
      return res.status(400).json({ 
        success: false,
        error: 'รูปแบบหมายเลขผู้ใช้ไม่ถูกต้อง' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ nationalId });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'ไม่พบข้อมูลผู้ใช้ในระบบ' 
      });
    }

    res.json({ 
      success: true, 
      message: 'เข้าสู่ระบบสำเร็จ',
      nationalId 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
    });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { nationalId } = req.body;

    // Validate user ID format
    if (!/^[A-Za-z0-9]{1,6}$/.test(nationalId)) {
      return res.status(400).json({ 
        success: false,
        error: 'รูปแบบหมายเลขผู้ใช้ไม่ถูกต้อง' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ nationalId });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'หมายเลขผู้ใช้นี้มีในระบบแล้ว' 
      });
    }

    // Create new user with only nationalId
    const user = new User({ nationalId });
    await user.save();

    res.status(201).json({ 
      success: true, 
      message: 'ลงทะเบียนสำเร็จ',
      nationalId 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการลงทะเบียน' 
    });
  }
});

router.get('/check/:nationalId', async (req, res) => {
  try {
    const user = await User.findOne({ nationalId: req.params.nationalId });
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Check error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบ' });
  }
});

module.exports = router;