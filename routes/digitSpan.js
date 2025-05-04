const express = require('express');
const router = express.Router();
const DigitSpan = require('../models/DigitSpan');

// GET - ดึงประวัติการทำแบบทดสอบของผู้ใช้
router.get('/:nationalId', async (req, res) => {
  try {
    const results = await DigitSpan.findOne({ nationalId: req.params.nationalId })
                                  .sort({ 'sessions.completedAt': -1 });
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
      forwardTime: sessionData.forwardTime || 0,
      backwardTime: sessionData.backwardTime || 0,
      successRate: sessionData.successRate || 0,
      forwardSuccessRate: sessionData.forwardSuccessRate || 0,
      backwardSuccessRate: sessionData.backwardSuccessRate || 0,
      modes: sessionData.modes || []
    });

    // เก็บแค่ 10 ครั้งล่าสุด
    if (digitSpan.sessions.length > 10) {
      digitSpan.sessions = digitSpan.sessions.slice(-10);
    }

    await digitSpan.save();

    // ส่งข้อมูลเปรียบเทียบกลับไป
    const comparison = digitSpan.comparison;
    
    res.json({
      success: true,
      digitSpan,
      comparison,
      messages: generateComparisonMessages(comparison, sessionData)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function สำหรับสร้างข้อความเปรียบเทียบ
function generateComparisonMessages(comparison, sessionData) {
  if (!comparison) return { overall: 'เริ่มต้นได้ดี! ลองเล่นอีกครั้งเพื่อเปรียบเทียบผล' };

  const messages = {
    overall: '',
    modes: {},
    successRate: ''
  };

  // ตรวจสอบว่าเล่นโหมดไหน
  const playingForward = sessionData.forwardTime > 0;
  const playingBackward = sessionData.backwardTime > 0;

  // ข้อความเปรียบเทียบเวลา
  if (playingForward && comparison.forwardTime) {
    if (comparison.forwardTime.improved) {
      messages.overall = 'ยอดเยี่ยม! คุณใช้เวลาน้อยลงกว่าครั้งที่แล้ว';
      messages.modes.forward = 'โหมด Forward: ทำได้เร็วขึ้น!';
    } else {
      messages.overall = 'ไม่เป็นไร! ลองพยายามทำให้เร็วขึ้นในครั้งหน้านะ';
      messages.modes.forward = 'โหมด Forward: ใช้เวลามากขึ้น';
    }
  } else if (playingBackward && comparison.backwardTime) {
    if (comparison.backwardTime.improved) {
      messages.overall = 'ยอดเยี่ยม! คุณใช้เวลาน้อยลงกว่าครั้งที่แล้ว';
      messages.modes.backward = 'โหมด Backward: ทำได้เร็วขึ้น!';
    } else {
      messages.overall = 'ไม่เป็นไร! ลองพยายามทำให้เร็วขึ้นในครั้งหน้านะ';
      messages.modes.backward = 'โหมด Backward: ใช้เวลามากขึ้น';
    }
  }

  // ข้อความเปรียบเทียบอัตราการตอบถูก
  if (playingForward && comparison.forwardSuccessRate) {
    if (comparison.forwardSuccessRate.improved) {
      messages.successRate = 'อัตราการตอบถูกเพิ่มขึ้น! ความแม่นยำดีขึ้น';
    } else {
      messages.successRate = 'อัตราการตอบถูกลดลง ลองฝึกฝนเพื่อเพิ่มความแม่นยำ';
    }
  } else if (playingBackward && comparison.backwardSuccessRate) {
    if (comparison.backwardSuccessRate.improved) {
      messages.successRate = 'อัตราการตอบถูกเพิ่มขึ้น! ความแม่นยำดีขึ้น';
    } else {
      messages.successRate = 'อัตราการตอบถูกลดลง ลองฝึกฝนเพื่อเพิ่มความแม่นยำ';
    }
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

// GET - ดึงข้อมูลสถิติและการวิเคราะห์
router.get('/statistics/:nationalId', async (req, res) => {
  try {
    const { nationalId } = req.params;
    const result = await DigitSpan.findOne({ nationalId });
    
    if (!result || !result.sessions || result.sessions.length === 0) {
      return res.json({ message: 'ไม่พบข้อมูลการทดสอบ' });
    }
    
    // คำนวณค่าเฉลี่ยต่างๆ
    const forwardSessions = result.sessions.filter(s => s.forwardTime > 0);
    const backwardSessions = result.sessions.filter(s => s.backwardTime > 0);
    
    const stats = {
      totalSessions: result.sessions.length,
      forward: {
        count: forwardSessions.length,
        avgTime: forwardSessions.length > 0 
          ? forwardSessions.reduce((sum, s) => sum + s.forwardTime, 0) / forwardSessions.length 
          : 0,
        avgSuccessRate: forwardSessions.length > 0 
          ? forwardSessions.reduce((sum, s) => sum + s.forwardSuccessRate, 0) / forwardSessions.length 
          : 0,
        trend: calculateTrend(forwardSessions, 'forwardTime')
      },
      backward: {
        count: backwardSessions.length,
        avgTime: backwardSessions.length > 0 
          ? backwardSessions.reduce((sum, s) => sum + s.backwardTime, 0) / backwardSessions.length 
          : 0,
        avgSuccessRate: backwardSessions.length > 0 
          ? backwardSessions.reduce((sum, s) => sum + s.backwardSuccessRate, 0) / backwardSessions.length 
          : 0,
        trend: calculateTrend(backwardSessions, 'backwardTime')
      },
      lastSession: result.sessions[result.sessions.length - 1],
      improvement: calculateImprovement(result.sessions)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function คำนวณแนวโน้ม
function calculateTrend(sessions, timeField) {
  if (sessions.length < 2) return 'ยังไม่มีข้อมูลเพียงพอ';
  
  // สร้างข้อมูลสำหรับคำนวณแนวโน้ม
  const data = sessions.map((s, i) => ({ 
    x: i, 
    y: s[timeField] 
  }));
  
  // คำนวณ Linear Regression
  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const sumXY = data.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sumXX = data.reduce((sum, point) => sum + (point.x * point.x), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  if (slope < -0.5) return 'ดีขึ้นอย่างชัดเจน';
  if (slope < 0) return 'มีแนวโน้มดีขึ้น';
  if (slope === 0) return 'คงที่';
  if (slope > 0.5) return 'แย่ลงอย่างชัดเจน';
  if (slope > 0) return 'มีแนวโน้มแย่ลง';
  
  return 'ยังไม่มีรูปแบบชัดเจน';
}

// Helper function คำนวณการพัฒนา
function calculateImprovement(sessions) {
  if (sessions.length < 2) return null;
  
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  
  const forwardImprovement = (first.forwardTime && last.forwardTime) ? 
    ((first.forwardTime - last.forwardTime) / first.forwardTime) * 100 : null;
  
  const backwardImprovement = (first.backwardTime && last.backwardTime) ? 
    ((first.backwardTime - last.backwardTime) / first.backwardTime) * 100 : null;
  
  const forwardSuccessImprovement = (first.forwardSuccessRate && last.forwardSuccessRate) ? 
    (last.forwardSuccessRate - first.forwardSuccessRate) : null;
  
  const backwardSuccessImprovement = (first.backwardSuccessRate && last.backwardSuccessRate) ? 
    (last.backwardSuccessRate - first.backwardSuccessRate) : null;
  
  return {
    forwardTimeImprovement: forwardImprovement,
    backwardTimeImprovement: backwardImprovement,
    forwardSuccessImprovement: forwardSuccessImprovement,
    backwardSuccessImprovement: backwardSuccessImprovement
  };
}

module.exports = router;