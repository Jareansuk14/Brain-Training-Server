const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  time: {
    type: Number,
    required: true
  },
  moves: {
    type: Number,
    required: true
  }
});

const gameResultSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  sessions: [{
    completedAt: {
      type: Date,
      default: Date.now
    },
    totalTime: {
      type: Number,
      required: true
    },
    totalMoves: {
      type: Number,
      required: true
    },
    games: [gameSessionSchema]
  }]
}, {
  timestamps: true
});

// เพิ่ม virtual field สำหรับการเปรียบเทียบ
gameResultSchema.virtual('comparison').get(function() {
  if (this.sessions.length < 2) return null;

  const currentSession = this.sessions[this.sessions.length - 1];
  const previousSession = this.sessions[this.sessions.length - 2];

  return {
    totalTime: {
      difference: previousSession.totalTime - currentSession.totalTime,
      improved: currentSession.totalTime < previousSession.totalTime
    },
    totalMoves: {
      difference: previousSession.totalMoves - currentSession.totalMoves,
      improved: currentSession.totalMoves < previousSession.totalMoves
    },
    games: currentSession.games.map((game, index) => ({
      level: game.level,
      time: {
        difference: previousSession.games[index].time - game.time,
        improved: game.time < previousSession.games[index].time
      },
      moves: {
        difference: previousSession.games[index].moves - game.moves,
        improved: game.moves < previousSession.games[index].moves
      }
    }))
  };
});

module.exports = mongoose.model('GameResult', gameResultSchema);