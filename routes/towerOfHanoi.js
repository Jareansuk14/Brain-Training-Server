const express = require('express');
const router = express.Router();
const TowerOfHanoi = require('../models/TowerOfHanoi');

// GET - ดึงข้อมูลผู้เล่น
router.get('/:nationalId', async (req, res) => {
  try {
    const userRecord = await TowerOfHanoi.findOne({ 
      nationalId: req.params.nationalId 
    });
    
    if (!userRecord) {
      return res.json({ levelStats: [] });
    }

    res.json(userRecord);
  } catch (error) {
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      details: error.message 
    });
  }
});

// GET - ดึงสถิติเฉพาะระดับ
router.get('/:nationalId/level/:level', async (req, res) => {
  try {
    const userRecord = await TowerOfHanoi.findOne({ 
      nationalId: req.params.nationalId 
    });
    
    if (!userRecord) {
      return res.json({ message: 'ไม่พบข้อมูลผู้เล่น' });
    }

    const levelStat = userRecord.levelStats.find(
      stat => stat.level === parseInt(req.params.level)
    );

    if (!levelStat) {
      return res.json({ message: 'ไม่พบข้อมูลระดับที่ต้องการ' });
    }

    res.json(levelStat);
  } catch (error) {
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      details: error.message 
    });
  }
});

// POST - บันทึกผลการเล่น
router.post('/save-session', async (req, res) => {
  try {
    const { nationalId, sessionData } = req.body;
    const { level, timeSpent, moves } = sessionData;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!nationalId || !level || timeSpent == null || moves == null) {
      return res.status(400).json({ 
        error: 'กรุณาระบุข้อมูลให้ครบถ้วน' 
      });
    }

    let userRecord = await TowerOfHanoi.findOne({ nationalId });
    
    // ถ้าไม่มีข้อมูลผู้เล่น ให้สร้างใหม่
    if (!userRecord) {
      userRecord = new TowerOfHanoi({ 
        nationalId, 
        levelStats: [] 
      });
    }

    // หาหรือสร้างสถิติของระดับนั้น
    let levelStat = userRecord.levelStats.find(stat => stat.level === level);
    let comparison = null;

    if (!levelStat) {
      // กรณีเล่นระดับนี้เป็นครั้งแรก
      levelStat = {
        level,
        bestTime: timeSpent,
        bestMoves: moves,
        lastTime: timeSpent,
        lastMoves: moves,
        lastPlayedAt: new Date(),
        history: [{
          completedAt: new Date(),
          timeSpent,
          moves
        }]
      };
      userRecord.levelStats.push(levelStat);
    } else {
      // กรณีเคยเล่นระดับนี้มาแล้ว
      comparison = {
        level,
        time: {
          current: timeSpent,
          previous: levelStat.lastTime,
          difference: levelStat.lastTime - timeSpent,
          improved: timeSpent < levelStat.lastTime,
          bestTime: levelStat.bestTime
        },
        moves: {
          current: moves,
          previous: levelStat.lastMoves,
          difference: levelStat.lastMoves - moves,
          improved: moves < levelStat.lastMoves,
          bestMoves: levelStat.bestMoves
        }
      };

      // อัพเดตสถิติที่ดีที่สุด
      if (timeSpent < levelStat.bestTime) {
        levelStat.bestTime = timeSpent;
      }
      if (moves < levelStat.bestMoves) {
        levelStat.bestMoves = moves;
      }

      // อัพเดตผลล่าสุด
      levelStat.lastTime = timeSpent;
      levelStat.lastMoves = moves;
      levelStat.lastPlayedAt = new Date();

      // เพิ่มประวัติการเล่น
      levelStat.history.push({
        completedAt: new Date(),
        timeSpent,
        moves
      });

      // เก็บประวัติแค่ 5 ครั้งล่าสุด
      if (levelStat.history.length > 5) {
        levelStat.history = levelStat.history.slice(-5);
      }
    }

    await userRecord.save();

    // ส่งผลลัพธ์กลับไป
    res.json({
      success: true,
      comparison,
      messages: comparison ? generateComparisonMessages(comparison) : null
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      details: error.message 
    });
  }
});

// ฟังก์ชันสร้างข้อความเปรียบเทียบ
function generateComparisonMessages(comparison) {
  const timeImproved = comparison.time.improved;
  const movesImproved = comparison.moves.improved;
  const level = comparison.level;
  
  // สร้างข้อความหลัก
  let mainMessage = `ระดับ ${level}: `;
  
  if (timeImproved && movesImproved) {
    mainMessage += 'ยอดเยี่ยม! คุณทำเวลาและจำนวนการเคลื่อนย้ายได้ดีกว่าครั้งที่แล้ว';
  } else if (timeImproved) {
    mainMessage += 'เยี่ยม! คุณทำเวลาได้ดีกว่าครั้งที่แล้ว';
  } else if (movesImproved) {
    mainMessage += 'เยี่ยม! คุณใช้การเคลื่อนย้ายน้อยกว่าครั้งที่แล้ว';
  } else {
    mainMessage += 'พยายามต่อไป! ลองทำให้เร็วขึ้นหรือใช้การเคลื่อนย้ายให้น้อยลงในครั้งหน้า';
  }

  // เพิ่มข้อความเกี่ยวกับสถิติที่ดีที่สุด
  const isNewBestTime = comparison.time.current === comparison.time.bestTime;
  const isNewBestMoves = comparison.moves.current === comparison.moves.bestMoves;
  
  let recordMessage = '';
  if (isNewBestTime && isNewBestMoves) {
    recordMessage = 'คุณทำลายสถิติทั้งเวลาและจำนวนการเคลื่อนย้าย!';
  } else if (isNewBestTime) {
    recordMessage = 'คุณทำลายสถิติด้านเวลา!';
  } else if (isNewBestMoves) {
    recordMessage = 'คุณทำลายสถิติจำนวนการเคลื่อนย้าย!';
  }

  return {
    main: mainMessage,
    record: recordMessage,
    details: {
      time: {
        difference: Math.abs(comparison.time.difference),
        improved: timeImproved
      },
      moves: {
        difference: Math.abs(comparison.moves.difference),
        improved: movesImproved
      }
    }
  };
}

module.exports = router;