const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ["easy", "medium", "hard"],
  },
  time: {
    type: Number,
    required: true,
  },
  moves: {
    type: Number,
    required: true,
  },
});

const gameResultSchema = new mongoose.Schema(
  {
    nationalId: {
      type: String,
      required: true,
      index: true,
    },
    sessions: [
      {
        completedAt: {
          type: Date,
          default: Date.now,
        },
        totalTime: {
          type: Number,
          required: true,
        },
        totalMoves: {
          type: Number,
          required: true,
        },
        games: [gameSessionSchema],
      },
    ],
  },
  {
    timestamps: true,
  }
);

gameResultSchema.virtual("comparison").get(function () {
  if (this.sessions.length < 2) return null;

  const currentSession = this.sessions[this.sessions.length - 1];
  const previousSession = this.sessions[this.sessions.length - 2];

  // เปรียบเทียบผลรวม
  const comparison = {
    totalTime: {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime,
    },
    totalMoves: {
      difference: previousSession.totalMoves - currentSession.totalMoves,
      improved: currentSession.totalMoves < previousSession.totalMoves,
    },
    games: [],
  };

  // เปรียบเทียบแต่ละระดับ
  currentSession.games.forEach((currentGame) => {
    // หาเกมที่ตรงกันจากเซสชันก่อนหน้า
    const previousGame = previousSession.games.find(
      (game) => game.level === currentGame.level
    );

    if (previousGame) {
      // ถ้ามีข้อมูลเกมระดับนั้นในเซสชันก่อนหน้า
      comparison.games.push({
        level: currentGame.level,
        time: {
          difference: previousGame.time - currentGame.time,
          improved: currentGame.time < previousGame.time,
        },
        moves: {
          difference: previousGame.moves - currentGame.moves,
          improved: currentGame.moves < previousGame.moves,
        },
      });
    } else {
      // ถ้าไม่มีข้อมูลเกมระดับนั้นในเซสชันก่อนหน้า
      comparison.games.push({
        level: currentGame.level,
        time: null,
        moves: null,
      });
    }
  });

  return comparison;
});

module.exports = mongoose.model("GameResult", gameResultSchema);
