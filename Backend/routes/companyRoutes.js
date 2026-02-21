const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const IntelligenceResult = require('../models/IntelligenceResult');
const { auth } = require('../middleware/auth');

// Middleware to check for company admin role
const isCompanyAdmin = async (req, res, next) => {
    try {
        // if (req.user.role !== 'company_admin' && req.user.role !== 'admin') {
        //    return res.status(403).json({ success: false, message: 'Access denied: Company Admin only' });
        // }
        next();
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   GET /api/company/team
// @desc    Get team members and their stats for the dashboard
router.get('/team', auth(), isCompanyAdmin, async (req, res) => {
    try {
        // Find company managed by this user
        // Note: For MVP, linking via Company model or potential direct linkage
        // Let's assume the user has a 'company' field populated
        const adminUser = await User.findById(req.user.id);

        if (!adminUser.company) {
            // Demo Mode for new users - Return empty state instead of 404
            return res.json({
                success: true,
                companyName: "My Workspace",
                stats: { totalMembers: 0, averageScore: 0, highPerformers: 0 },
                members: []
            });
        }

        const teamMembers = await User.find({ company: adminUser.company })
            .select('name email profileType stats bestScoreEver lastTestDate history');

        // Enhance with latest results
        const teamStats = teamMembers.map(member => {
            return {
                id: member._id,
                name: member.name,
                role: member.profileType || 'Candidate',
                score: member.bestScoreEver || 0,
                lastActive: member.lastTestDate,
                tier: member.stats?.tier || 'Observer',
                status: member.bestScoreEver > 0 ? 'Active' : 'Pending',
                integrity: 'High' // aggregate from history later
            };
        });

        // Company Aggregates
        const totalScore = teamStats.reduce((sum, m) => sum + m.score, 0);
        const avgScore = teamStats.length ? Math.round(totalScore / teamStats.length) : 0;

        res.json({
            success: true,
            companyName: "Tech Corp Inc.", // Replace with populate()
            stats: {
                totalMembers: teamStats.length,
                averageScore: avgScore,
                highPerformers: teamStats.filter(m => m.score > 800).length
            },
            members: teamStats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/company/invite
// @desc    Invite a new member (Stub)
router.post('/invite', auth(), isCompanyAdmin, async (req, res) => {
    // Stub implementation
    res.json({ success: true, message: `Invitation sent to ${req.body.email}` });
});

// @route   POST /api/company/reputation/evaluate
// @desc    Trigger reputation analysis (Admin or Scheduled)
router.post('/reputation/evaluate', auth(), isCompanyAdmin, async (req, res) => {
    try {
        const { evaluateCompanyReputation } = require('../ai-agents/company/reputationOrchestrator');

        // Find company ID for the user
        const user = await User.findById(req.user.id);
        if (!user.company) return res.status(404).json({ message: "No company found" });

        const reputation = await evaluateCompanyReputation(user.company);

        res.json({ success: true, reputation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Evaluation failed' });
    }
});

// @route   GET /api/company/reputation
// @desc    Get current reputation scorecard
router.get('/reputation', auth(), isCompanyAdmin, async (req, res) => {
    try {
        const CompanyReputation = require('../models/CompanyReputation');
        const user = await User.findById(req.user.id);

        if (!user.company) {
            // Demo Mode if no company
            return res.json({
                success: true,
                reputation: {
                    scores: { reputation: 78, thinkingBar: 8.5, legitimacy: 95, talentOutcome: 82 },
                    signature: { archetype: "Product-Led Innovator" },
                    outcomes: { avgSenseIndexHired: 1150 }
                }
            });
        }

        const reputation = await CompanyReputation.findOne({ companyId: user.company });
        if (!reputation) return res.status(404).json({ message: "Reputation not yet calculated" });

        res.json({ success: true, reputation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
