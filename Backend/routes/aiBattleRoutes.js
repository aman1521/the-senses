const express = require('express');
const {
    getAIProfiles,
    simulateAIBattle,
    getBattleHistory,
    submitVote,
} = require('../controllers/aiBattleController');

const router = express.Router();

// ⚠️ NOTE: AI BATTLE FEATURE - TEMPORARILY HIDDEN FROM USERS
// This feature is fully functional but not exposed in the frontend (Next.js app).
// Backend routes remain active for future use.
// See: AI_BATTLE_HIDDEN.md for details on how to re-enable.
// Status: Hidden during Phase 2 to focus on core intelligence ranking flow.

// GET /api/ai-battles/profiles - List AI profiles
router.get('/profiles', getAIProfiles);

// POST /api/ai-battles/simulate - Run AI vs AI battle
router.post('/simulate', simulateAIBattle);

// POST /api/ai-battles/vote - Submit user vote
router.post('/vote', submitVote);

// GET /api/ai-battles/history - Get battle statistics
router.get('/history', getBattleHistory);

module.exports = router;
