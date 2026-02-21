const express = require('express');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { byDimension, getGlobalLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

// GET /api/leaderboard/dimension - existing
router.get("/dimension", byDimension);
// GET /api/leaderboard - consolidated from leaderboard.routes.js
router.get("/", getGlobalLeaderboard);
router.get('/global', auth(false), asyncHandler(getGlobalLeaderboard));

module.exports = router;
