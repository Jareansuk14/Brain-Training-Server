const express = require("express");
const router = express.Router();
const GameResult = require("../models/GameResult");

// Get user's game history
router.get("/:nationalId", async (req, res) => {
  try {
    const results = await GameResult.findOne({
      nationalId: req.params.nationalId,
    })
      .sort({ "sessions.completedAt": -1 })
      .limit(2);
    res.json(results || { sessions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save new game session
router.post("/save-session", async (req, res) => {
  try {
    const { nationalId, sessionData } = req.body;

    let gameResult = await GameResult.findOne({ nationalId });

    if (!gameResult) {
      gameResult = new GameResult({
        nationalId,
        sessions: [],
      });
    }

    // Add new session
    gameResult.sessions.push({
      completedAt: new Date(),
      totalTime: sessionData.totalTime,
      totalMoves: sessionData.totalMoves,
      games: sessionData.games,
    });

    // Keep only last 5 sessions
    if (gameResult.sessions.length > 5) {
      gameResult.sessions = gameResult.sessions.slice(-5);
    }

    await gameResult.save();

    // ส่งข้อมูลเปรียบเทียบกลับไป
    const comparison = gameResult.comparison;

    res.json({
      success: true,
      gameResult,
      comparison,
      messages: generateComparisonMessages(comparison),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate comparison messages
function generateComparisonMessages(comparison) {
  if (!comparison) return null;

  const messages = {
    overall: "",
    levels: {},
  };

  // Overall message
  if (comparison.totalTime.improved && comparison.totalMoves.improved) {
    messages.overall =
      "ยอดเยี่ยมมาก! คุณทำได้ดีขึ้นทั้งเวลาและจำนวนการเคลื่อนย้าย";
  } else if (comparison.totalTime.improved) {
    messages.overall =
      "เยี่ยม! คุณใช้เวลาน้อยลง แต่ยังมีโอกาสลดจำนวนการเคลื่อนย้ายได้อีก";
  } else if (comparison.totalMoves.improved) {
    messages.overall =
      "ดีมาก! คุณใช้การเคลื่อนย้ายน้อยลง แต่ลองพยายามทำให้เร็วขึ้นอีกนิดนะ";
  } else {
    messages.overall = "ไม่เป็นไร! การฝึกฝนจะทำให้คุณทำได้ดีขึ้นในครั้งต่อไป";
  }

  // Level specific messages
  comparison.games.forEach((game) => {
    const levelMsg = [];
    if (game.time.improved) {
      levelMsg.push("ใช้เวลาน้อยลง");
    }
    if (game.moves.improved) {
      levelMsg.push("ใช้การเคลื่อนย้ายน้อยลง");
    }

    messages.levels[game.level] =
      levelMsg.length > 0
        ? `ระดับ ${game.level}: ${levelMsg.join(" และ ")}`
        : `ระดับ ${game.level}: พยายามต่อไป คุณทำได้!`;
  });

  return messages;
}

module.exports = router;
