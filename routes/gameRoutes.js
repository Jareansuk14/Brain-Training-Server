// routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Save game record
router.post('/record', gameController.saveGameRecord);

// Get level statistics
router.get('/stats/:userId/:level', gameController.getLevelStats);

// Get user progress
router.get('/progress/:userId', gameController.getUserProgress);

module.exports = router;