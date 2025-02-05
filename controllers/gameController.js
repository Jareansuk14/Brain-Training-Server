// controllers/gameController.js
const GameRecord = require('../models/GameRecord');

// Save new game record
exports.saveGameRecord = async (req, res) => {
  try {
    const { userId, level, moves, timeSpent, completed } = req.body;

    // Validate input
    if (!userId || !level || moves === undefined || timeSpent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create new record
    const newRecord = await GameRecord.create({
      userId,
      level,
      moves,
      timeSpent,
      completed
    });

    // Get previous best record for comparison
    const previousBest = await GameRecord.findOne({
      userId,
      level,
      completed: true,
      timestamp: { $lt: newRecord.timestamp }
    }).sort({ timestamp: -1 });

    // Prepare comparison data if previous record exists
    let comparison = null;
    if (previousBest) {
      comparison = {
        movesDifference: moves - previousBest.moves,
        timeDifference: timeSpent - previousBest.timeSpent,
        previousBestMoves: previousBest.moves,
        previousBestTime: previousBest.timeSpent
      };
    }

    res.status(201).json({
      success: true,
      data: {
        record: newRecord,
        comparison,
        isFirstPlay: !previousBest
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving game record',
      error: error.message
    });
  }
};

// Get user's statistics for a specific level
exports.getLevelStats = async (req, res) => {
  try {
    const { userId, level } = req.params;

    // Get best record (completed games only)
    const bestRecord = await GameRecord.findOne({
      userId,
      level: parseInt(level),
      completed: true
    }).sort({ moves: 1, timeSpent: 1 });

    // Get last 5 games
    const recentGames = await GameRecord.find({
      userId,
      level: parseInt(level)
    })
    .sort({ timestamp: -1 })
    .limit(5);

    // Calculate average stats (for completed games only)
    const stats = await GameRecord.aggregate([
      {
        $match: {
          userId,
          level: parseInt(level),
          completed: true
        }
      },
      {
        $group: {
          _id: null,
          avgMoves: { $avg: '$moves' },
          avgTime: { $avg: '$timeSpent' },
          totalGames: { $sum: 1 },
          completedGames: {
            $sum: { $cond: ['$completed', 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        bestRecord,
        recentGames,
        stats: stats[0] || {
          avgMoves: 0,
          avgTime: 0,
          totalGames: 0,
          completedGames: 0
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching level statistics',
      error: error.message
    });
  }
};

// Get user's overall progress
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get stats for each level
    const levelStats = await GameRecord.aggregate([
      {
        $match: {
          userId,
          completed: true
        }
      },
      {
        $group: {
          _id: '$level',
          bestMoves: { $min: '$moves' },
          bestTime: { $min: '$timeSpent' },
          avgMoves: { $avg: '$moves' },
          avgTime: { $avg: '$timeSpent' },
          totalGames: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get overall stats
    const overallStats = await GameRecord.aggregate([
      {
        $match: {
          userId
        }
      },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          completedGames: {
            $sum: { $cond: ['$completed', 1, 0] }
          },
          totalTimePlayed: { $sum: '$timeSpent' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        levelStats,
        overallStats: overallStats[0] || {
          totalGames: 0,
          completedGames: 0,
          totalTimePlayed: 0
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user progress',
      error: error.message
    });
  }
};