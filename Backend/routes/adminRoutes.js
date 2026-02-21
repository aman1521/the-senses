const express = require('express');
const router = express.Router();
const User = require('../models/User');
const IntelligenceResult = require('../models/IntelligenceResult');
const { auth, requireRole } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const { getIntegrityEvents, getAIMetrics } = require('../controllers/dashboardController');

// @route   GET /api/admin/overview
// @desc    Get platform-wide statistics
router.get('/overview', auth(true), requireRole('admin'), async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTests = await IntelligenceResult.countDocuments();

        // Count tiers
        const tierCounts = await IntelligenceResult.aggregate([
            { $group: { _id: "$rank.tier", count: { $sum: 1 } } }
        ]);

        // Recent Signups
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');

        // Integrity Issues
        // Assuming we query IntegrityEvents, but for MVP we check trustScore
        const lowIntegrityCount = await IntelligenceResult.countDocuments({ trustScore: { $lt: 50 } });

        return successResponse(res, {
            stats: {
                totalUsers,
                totalTests,
                activeToday: 42, // Mock for now (redis/activity log needed)
                lowIntegrityCount
            },
            tiers: tierCounts,
            recentUsers
        });

    } catch (err) {
        console.error(err);
        return errorResponse(res, 'Server Error', 500, err.message);
    }
});

// @route   POST /api/admin/ban/:userId
// @desc    Ban a user (Stub)
router.post('/ban/:userId', auth(true), requireRole('admin'), async (req, res, next) => {
    return successResponse(res, { userId: req.params.userId }, `User ${req.params.userId} banned`);
});

// @route   GET /api/admin/integrity-events
// @desc    Get integrity events
router.get('/integrity-events', auth(true), requireRole('admin'), getIntegrityEvents);

// @route   GET /api/admin/ai-metrics
// @desc    Get AI metrics
router.get('/ai-metrics', auth(true), requireRole('admin'), getAIMetrics);

module.exports = router;
