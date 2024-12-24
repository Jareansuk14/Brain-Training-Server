const express = require('express');
const router = express.Router();
const GameResult = require('../models/GameResult');

// Get user's game history
router.get('/:nationalId', async (req, res) => {
  try {
    const results = await GameResult.findOne({ nationalId: req.params.nationalId })
                                  .sort({ 'sessions.completedAt': -1 });
    res.json(results || { sessions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save game result (ทั้งบันทึกรายระดับและรายเซสชั่น)
router.post('/save', async (req, res) => {
  try {
    const { nationalId, sessionData } = req.body;
    let gameResult = await GameResult.findOne({ nationalId });
    
    if (!gameResult) {
      gameResult = new GameResult({ 
        nationalId,
        sessions: []
      });
    }

    // จัดการข้อมูลเกม
    const currentSession = {
      completedAt: new Date(),
      totalTime: sessionData.totalTime,
      totalMoves: sessionData.totalMoves,
      games: sessionData.games.map(game => ({
        level: game.level,
        time: game.time,
        moves: game.moves
      }))
    };

    // เพิ่มเซสชั่นใหม่
    gameResult.sessions.push(currentSession);

    // เก็บแค่ 5 เซสชั่นล่าสุด
    if (gameResult.sessions.length > 5) {
      gameResult.sessions = gameResult.sessions.slice(-5);
    }

    await gameResult.save();

    // สร้างข้อมูลเปรียบเทียบ
    const previousSession = gameResult.sessions[gameResult.sessions.length - 2];
    const comparison = createComparisonData(previousSession, currentSession);
    
    res.json({
      success: true,
      gameResult,
      comparison,
      messages: generateComparisonMessages(comparison)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function สำหรับสร้างข้อมูลเปรียบเทียบ
function createComparisonData(previousSession, currentSession) {
  if (!previousSession) return null;

  const comparison = {
    totalTime: {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime
    },
    totalMoves: {
      difference: previousSession.totalMoves - currentSession.totalMoves,
      improved: currentSession.totalMoves < previousSession.totalMoves
    },
    games: []
  };

  // เปรียบเทียบแต่ละระดับ
  currentSession.games.forEach((currentGame, index) => {
    const previousGame = previousSession.games[index];
    if (previousGame && previousGame.level === currentGame.level) {
      comparison.games.push({
        level: currentGame.level,
        time: {
          difference: previousGame.time - currentGame.time,
          improved: currentGame.time < previousGame.time
        },
        moves: {
          difference: previousGame.moves - currentGame.moves,
          improved: currentGame.moves < previousGame.moves
        }
      });
    }
  });

  return comparison;
}

// Helper function to generate comparison messages
function generateComparisonMessages(comparison) {
  if (!comparison) return null;

  const messages = {
    overall: '',
    levels: {}
  };

  // Overall message
  if (comparison.totalTime.improved && comparison.totalMoves.improved) {
    messages.overall = 'ยอดเยี่ยมมาก! คุณทำได้ดีขึ้นทั้งเวลาและจำนวนการเคลื่อนย้าย';
  } else if (comparison.totalTime.improved) {
    messages.overall = 'เยี่ยม! คุณใช้เวลาน้อยลง แต่ยังมีโอกาสลดจำนวนการเคลื่อนย้ายได้อีก';
  } else if (comparison.totalMoves.improved) {
    messages.overall = 'ดีมาก! คุณใช้การเคลื่อนย้ายน้อยลง แต่ลองพยายามทำให้เร็วขึ้นอีกนิดนะ';
  } else {
    messages.overall = 'ไม่เป็นไร! การฝึกฝนจะทำให้คุณทำได้ดีขึ้นในครั้งต่อไป';
  }

  // Level specific messages
  comparison.games.forEach(game => {
    const levelMsg = [];
    if (game.time.improved) {
      levelMsg.push('ใช้เวลาน้อยลง');
    }
    if (game.moves.improved) {
      levelMsg.push('ใช้การเคลื่อนย้ายน้อยลง');
    }

    messages.levels[game.level] = levelMsg.length > 0 
      ? `ระดับ ${game.level}: ${levelMsg.join(' และ ')}`
      : `ระดับ ${game.level}: พยายามต่อไป คุณทำได้!`;
  });

  return messages;
}

module.exports = router;