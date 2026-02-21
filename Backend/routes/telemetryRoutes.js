const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { logTelemetry } = require('../controllers/telemetryController');

// @route   POST /api/v1/session/telemetry
// @desc    Receive telemetry batch
router.post('/telemetry', auth(), logTelemetry);

module.exports = router;
