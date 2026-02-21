const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Company-wide analytics
router.get('/company/:orgId', auth(), analyticsController.getCompanyAnalytics);

// Per-candidate deep analytics
router.get('/candidate/:userId', auth(), analyticsController.getCandidateAnalytics);

module.exports = router;
