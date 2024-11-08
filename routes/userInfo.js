// server/routes/userinfo.js
const express = require('express');
const router = express.Router();
const UserInfo = require('../models/UserInfo');

// Middleware to handle errors
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Get user info by national ID
router.get('/get/:nationalId', asyncHandler(async (req, res) => {
    const { nationalId } = req.params;
    const userInfo = await UserInfo.findOne({ nationalId });
    
    if (!userInfo) {
      // เปลี่ยนจาก 404 เป็น 200 และส่งข้อมูลว่างกลับไป
      return res.status(200).json({ 
        success: true,
        message: 'ไม่พบข้อมูลผู้ใช้ สร้างข้อมูลใหม่',
        user: {
          nationalId,
          basicInfo: {},
          deepQuestions: {}
        }
      });
    }
    
    res.json({
      success: true,
      message: 'พบข้อมูลผู้ใช้',
      user: userInfo
    });
  }));

// Save or update basic info
router.post('/save-basic-info', asyncHandler(async (req, res) => {
  const { nationalId, basicInfo } = req.body;

  // Validate required fields
  if (!nationalId || !basicInfo) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุข้อมูลให้ครบถ้วน' 
    });
  }

  // Update or create user info
  const userInfo = await UserInfo.findOneAndUpdate(
    { nationalId },
    { 
      nationalId,
      basicInfo,
      lastUpdated: new Date()
    },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  res.json({ 
    success: true, 
    message: 'บันทึกข้อมูลพื้นฐานสำเร็จ',
    user: userInfo 
  });
}));

// Save or update deep questions
router.post('/save-deep-questions', asyncHandler(async (req, res) => {
  const { nationalId, deepQuestions } = req.body;

  // Validate required fields
  if (!nationalId || !deepQuestions) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุข้อมูลให้ครบถ้วน' 
    });
  }

  // Update or create user info
  const userInfo = await UserInfo.findOneAndUpdate(
    { nationalId },
    { 
      nationalId,
      deepQuestions,
      lastUpdated: new Date()
    },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  res.json({ 
    success: true, 
    message: 'บันทึกคำถามเชิงลึกสำเร็จ',
    user: userInfo 
  });
}));

// Save all info (final submission)
router.post('/save-info', asyncHandler(async (req, res) => {
  const { nationalId, basicInfo, deepQuestions } = req.body;

  // Validate required fields
  if (!nationalId || !basicInfo || !deepQuestions) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุข้อมูลให้ครบถ้วน' 
    });
  }

  // Update or create complete user info
  const userInfo = await UserInfo.findOneAndUpdate(
    { nationalId },
    { 
      nationalId,
      basicInfo,
      deepQuestions,
      lastUpdated: new Date()
    },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true 
    }
  );

  res.json({ 
    success: true, 
    message: 'บันทึกข้อมูลทั้งหมดสำเร็จ',
    user: userInfo 
  });
}));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง' 
  });
});

module.exports = router;