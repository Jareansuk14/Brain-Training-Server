const express = require('express');
const router = express.Router();
const DigitSpan = require('../models/DigitSpan');

// GET - ดึงประวัติการทำแบบทดสอบของผู้ใช้
router.get('/:nationalId', async (req, res) => {
  try {
    const results = await DigitSpan.findOne({ nationalId: req.params.nationalId })
                                  .sort({ 'sessions.completedAt': -1 })
                                  .limit(2);
    res.json(results || { sessions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - บันทึกผลการทำแบบทดสอบ
router.post('/save-session', async (req, res) => {
  try {
    const { nationalId, sessionData } = req.body;

    let digitSpan = await DigitSpan.findOne({ nationalId });
    
    if (!digitSpan) {
      digitSpan = new DigitSpan({ 
        nationalId,
        sessions: []
      });
    }

    // เพิ่ม session ใหม่
    digitSpan.sessions.push({
      completedAt: new Date(),
      totalTime: sessionData.totalTime,
      forwardTime: sessionData.forwardTime,
      backwardTime: sessionData.backwardTime,
      modes: sessionData.modes
    });

    // เก็บแค่ 5 ครั้งล่าสุด
    if (digitSpan.sessions.length > 5) {
      digitSpan.sessions = digitSpan.sessions.slice(-5);
    }

    await digitSpan.save();

    // ส่งข้อมูลเปรียบเทียบกลับไป
    const comparison = digitSpan.comparison;
    
    res.json({
      success: true,
      digitSpan,
      comparison,
      messages: generateComparisonMessages(comparison)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function สำหรับสร้างข้อความเปรียบเทียบ
function generateComparisonMessages(comparison) {
  if (!comparison) return null;

  const messages = {
    overall: '',
    modes: {
      forward: '',
      backward: ''
    }
  };

  // ข้อความเปรียบเทียบรวม
  if (comparison.totalTime.improved) {
    messages.overall = 'ยอดเยี่ยม! คุณใช้เวลาน้อยลงกว่าครั้งที่แล้ว';
  } else {
    messages.overall = 'ไม่เป็นไร! ลองพยายามทำให้เร็วขึ้นในครั้งหน้านะ';
  }

  // ข้อความเปรียบเทียบแต่ละโหมด
  if (comparison.forwardTime.improved) {
    messages.modes.forward = 'Forward Mode: ทำได้เร็วขึ้น!';
  } else {
    messages.modes.forward = 'Forward Mode: ใช้เวลามากขึ้น';
  }

  if (comparison.backwardTime.improved) {
    messages.modes.backward = 'Backward Mode: ทำได้เร็วขึ้น!';
  } else {
    messages.modes.backward = 'Backward Mode: ใช้เวลามากขึ้น';
  }

  return messages;
}

// POST - Generate random digits for a level
router.post('/generate-digits', (req, res) => {
  const { level } = req.body;
  const digitCount = level + 2; // Level 1 = 3 digits, Level 2 = 4 digits, etc.
  
  let digits = [];
  while (digits.length < digitCount) {
    const digit = Math.floor(Math.random() * 10); // 0-9
    // ป้องกันไม่ให้มีเลขซ้ำติดกัน
    if (digits.length === 0 || digit !== digits[digits.length - 1]) {
      digits.push(digit);
    }
  }
  
  res.json({ digits });
});

module.exports = router;