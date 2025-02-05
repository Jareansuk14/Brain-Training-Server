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

    let userRecord = await TowerOfHanoi.findOne({ nationalId });
    let levelStat = userRecord.levelStats.find(stat => stat.level === level);
    
    // เก็บค่าเดิมไว้ก่อน
    const previousTime = levelStat ? levelStat.lastTime : null;
    const previousMoves = levelStat ? levelStat.lastMoves : null;

    // สร้าง comparison โดยใช้ค่าเดิม
    const comparison = levelStat ? {
      level,
      time: {
        current: timeSpent,
        previous: previousTime,
        difference: previousTime - timeSpent,
        improved: timeSpent < previousTime,
        bestTime: levelStat.bestTime
      },
      moves: {
        current: moves,
        previous: previousMoves,
        difference: previousMoves - moves,
        improved: moves < previousMoves,
        bestMoves: levelStat.bestMoves
      }
    } : null;

    // อัพเดตค่าใหม่หลังจากสร้าง comparison แล้ว
    if (!levelStat) {
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
      // อัพเดตค่า best ถ้าจำเป็น
      if (timeSpent < levelStat.bestTime) {
        levelStat.bestTime = timeSpent;
      }
      if (moves < levelStat.bestMoves) {
        levelStat.bestMoves = moves;
      }

      // อัพเดตค่าล่าสุด
      levelStat.lastTime = timeSpent;
      levelStat.lastMoves = moves;
      levelStat.lastPlayedAt = new Date();

      // เพิ่มประวัติ
      levelStat.history.push({
        completedAt: new Date(),
        timeSpent,
        moves
      });
    }

    await userRecord.save();

    res.json({
      success: true,
      comparison,
      messages: comparison ? generateComparisonMessages(comparison) : null,
      previousResults: {
        lastTime: previousTime,
        lastMoves: previousMoves,
        bestTime: levelStat.bestTime,
        bestMoves: levelStat.bestMoves
      }
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