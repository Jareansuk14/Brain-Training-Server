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

    // เก็บค่าก่อนหน้าไว้ก่อนอัพเดต
    const previousStats = {
      time: levelStat ? levelStat.lastTime : null,
      moves: levelStat ? levelStat.lastMoves : null
    };

    // สร้าง comparison โดยใช้ค่าที่เก็บไว้
    const comparison = levelStat ? {
      level,
      time: {
        current: timeSpent,
        previous: previousStats.time,
        difference: previousStats.time - timeSpent,
        improved: timeSpent < previousStats.time
      },
      moves: {
        current: moves,
        previous: previousStats.moves,
        difference: previousStats.moves - moves,
        improved: moves < previousStats.moves
      }
    } : null;

    // อัพเดตค่าใหม่
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
      // อัพเดตค่า best
      levelStat.bestTime = Math.min(levelStat.bestTime, timeSpent);
      levelStat.bestMoves = Math.min(levelStat.bestMoves, moves);
      
      // อัพเดตค่าล่าสุด
      levelStat.lastTime = timeSpent;
      levelStat.lastMoves = moves;
      levelStat.lastPlayedAt = new Date();

      levelStat.history.push({
        completedAt: new Date(),
        timeSpent,
        moves
      });

      if (levelStat.history.length > 5) {
        levelStat.history = levelStat.history.slice(-5);
      }
    }

    await userRecord.save();

    // ส่งค่ากลับไป Frontend
    res.json({
      success: true,
      comparison,
      previousResults: {
        lastTime: previousStats.time,
        lastMoves: previousStats.moves,
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