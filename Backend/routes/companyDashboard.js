const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const companyDashboardController = require('../controllers/companyDashboardController');

/**
 * @route   GET /api/company/candidates/:candidateId
 * @desc    Get candidate performance overview (NO social metrics)
 * @access  Private (Company accounts only)
 */
router.get('/candidates/:candidateId', auth(), companyDashboardController.getCandidateOverview);

/**
 * @route   GET /api/company/candidates/:candidateId/thinking
 * @desc    Get candidate's public thinking (content only, NO engagement)
 * @access  Private (Company accounts only)
 */
router.get('/candidates/:candidateId/thinking', auth(), companyDashboardController.getCandidateThinking);

/**
 * @route   GET /api/company/candidates/:candidateId/performance
 * @desc    Get detailed performance breakdown
 * @access  Private (Company accounts only)
 */
router.get('/candidates/:candidateId/performance', auth(), companyDashboardController.getPerformanceBreakdown);

/**
 * @route   POST /api/company/compare
 * @desc    Compare multiple candidates
 * @access  Private (Company accounts only)
 */
router.post('/compare', auth(), companyDashboardController.compareCandidates);

module.exports = router;
