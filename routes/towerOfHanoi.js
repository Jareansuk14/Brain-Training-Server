const express = require('express');
const router = express.Router();
const TowerOfHanoi = require('../models/TowerOfHanoi');

// GET - ดึงประวัติการเล่นของผู้ใช้
router.get('/:nationalId', async (req, res) => {
  try {
    const results = await TowerOfHanoi.findOne({ nationalId: req.params.nationalId })
                                     .sort({ 'sessions.completedAt': -1 })
                                     .limit(2);
    res.json(results || { sessions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - บันทึกผลการเล่น
router.post('/save-session', async (req, res) => {
  try {
    const { nationalId, sessionData } = req.body;

    let towerOfHanoi = await TowerOfHanoi.findOne({ nationalId });
    
    if (!towerOfHanoi) {
      towerOfHanoi = new TowerOfHanoi({ 
        nationalId,
        sessions: []
      });
    }

    // เพิ่ม session ใหม่
    towerOfHanoi.sessions.push({
      completedAt: new Date(),
      totalTime: sessionData.totalTime,
      totalMoves: sessionData.totalMoves,
      levels: sessionData.levels.map(level => ({
        level: level.level,
        moves: level.moves,
        minMoves: Math.pow(2, level.level + 2) - 1, // คำนวณจำนวนการเคลื่อนย้ายน้อยที่สุดที่เป็นไปได้
        timeSpent: level.timeSpent,
        completed: level.completed
      }))
    });

    // เก็บแค่ 5 ครั้งล่าสุด
    if (towerOfHanoi.sessions.length > 5) {
      towerOfHanoi.sessions = towerOfHanoi.sessions.slice(-5);
    }

    await towerOfHanoi.save();

    // ส่งข้อมูลเปรียบเทียบกลับไป
    const comparison = towerOfHanoi.comparison;
    
    res.json({
      success: true,
      towerOfHanoi,
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
    levels: []
  };

  // ข้อความเปรียบเทียบรวม
  const timeImproved = comparison.totalTime.improved;
  const movesImproved = comparison.totalMoves.improved;

  if (timeImproved && movesImproved) {
    messages.overall = 'ยอดเยี่ยม! คุณทำได้เร็วขึ้นและใช้การเคลื่อนย้ายน้อยลงกว่าครั้งที่แล้ว';
  } else if (timeImproved) {
    messages.overall = 'ดีขึ้น! คุณทำได้เร็วขึ้นกว่าครั้งที่แล้ว';
  } else if (movesImproved) {
    messages.overall = 'ดีขึ้น! คุณใช้การเคลื่อนย้ายน้อยลงกว่าครั้งที่แล้ว';
  } else {
    messages.overall = 'ไม่เป็นไร! ลองพยายามทำให้เร็วขึ้นและใช้การเคลื่อนย้ายให้น้อยลงในครั้งหน้านะ';
  }

  // ข้อความเปรียบเทียบแต่ละ level
  comparison.levelComparisons.forEach((levelComp, index) => {
    if (!levelComp) return;

    const level = levelComp.level;
    const timeMsg = levelComp.timeImprovement.improved ? 'เร็วขึ้น' : 'ช้าลง';
    const movesMsg = levelComp.movesImprovement.improved ? 'น้อยลง' : 'มากขึ้น';

    messages.levels.push({
      level,
      message: `Level ${level}: ใช้เวลา${timeMsg} และมีการเคลื่อนย้าย${movesMsg}`
    });
  });

  return messages;
}

module.exports = router;