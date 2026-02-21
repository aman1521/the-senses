const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/publicController');

// Public endpoint - no auth required
router.get('/stats', getPlatformStats);

module.exports = router;
