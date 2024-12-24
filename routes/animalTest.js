const express = require('express');
const router = express.Router();
const AnimalTest = require('../models/AnimalTest');

// GET - ดึงประวัติการทำแบบทดสอบของผู้ใช้
router.get('/:nationalId', async (req, res) => {
  try {
    const results = await AnimalTest.findOne({ nationalId: req.params.nationalId })
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

    let testResult = await AnimalTest.findOne({ nationalId });
    
    if (!testResult) {
      testResult = new AnimalTest({ 
        nationalId,
        sessions: []
      });
    }

    // เพิ่มเซสชันใหม่
    testResult.sessions.push({
      completedAt: new Date(),
      totalTime: sessionData.totalTime,
      correctAnswers: sessionData.correctAnswers,
      totalQuestions: sessionData.totalQuestions,
      answers: sessionData.answers
    });

    // เก็บแค่ 5 ครั้งล่าสุด
    if (testResult.sessions.length > 5) {
      testResult.sessions = testResult.sessions.slice(-5);
    }

    await testResult.save();

    // ส่งข้อมูลเปรียบเทียบกลับไป
    const comparison = testResult.comparison;
    
    res.json({
      success: true,
      testResult,
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
    overall: ''
  };

  // สร้างข้อความสรุปรวม
  if (comparison.correctAnswers.improved && comparison.totalTime.improved) {
    messages.overall = 'ยอดเยี่ยมมาก! คุณตอบถูกมากขึ้นและใช้เวลาน้อยลง';
  } else if (comparison.correctAnswers.improved) {
    messages.overall = 'เยี่ยม! คุณตอบถูกมากขึ้น แต่ยังสามารถพัฒนาเรื่องเวลาได้อีก';
  } else if (comparison.totalTime.improved) {
    messages.overall = 'ดีมาก! คุณทำได้เร็วขึ้น แต่ลองพยายามเพิ่มความแม่นยำนะ';
  } else {
    messages.overall = 'ไม่เป็นไร! การฝึกฝนอย่างสม่ำเสมอจะช่วยให้คุณพัฒนาขึ้น';
  }

  return messages;
}

module.exports = router;