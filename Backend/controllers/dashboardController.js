const IntelligenceResult = require("../models/IntelligenceResult");
const User = require("../models/User");
const IntegrityEvent = require("../models/IntegrityEvent");
const AIMetrics = require("../models/AIMetrics");
const { suggestCareerPath } = require("../ai-agents/insights/careerPath");

/** 
 * @desc    Get AI-powered career advice based on latest performance
 * @route   GET /api/dashboard/career-advice
 * @access  Private
 */
const getCareerAdvice = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get latest result
        const latestResult = await IntelligenceResult.findOne({
            $or: [{ userId: userId.toString() }, { userId: userId }],
            isFinalized: true
        }).sort({ createdAt: -1 });

        if (!latestResult) {
            return res.status(200).json({
                success: true,
                advice: "Complete your first assessment to unlock Career AI."
            });
        }

        // Extract profile data
        const profile = latestResult.profile || {};
        const jobProfile = latestResult.rank?.field || "General Professional";
        const strengths = profile.strengths || [];
        const weaknesses = profile.cognitiveBiases || []; // Using biases as areas for improvement for now

        console.log(`🤖 Generative Career Advice for ${jobProfile}...`);

        const suggestedRole = await suggestCareerPath({
            jobProfile,
            strengths,
            weaknesses
        });

        res.status(200).json({
            success: true,
            suggestedRole,
            basedOn: {
                strengths,
                field: jobProfile
            }
        });

    } catch (error) {
        console.error("Career Advice Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate advice",
            advice: "Senior Specialist" // Fallback
        });
    }
};

// @desc    Get user dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id; // Use _id directly from auth middleware

        // Try to find results with either string or ObjectId userId
        const results = await IntelligenceResult.find({
            $or: [
                { userId: userId.toString() },
                { userId: userId }
            ],
            isFinalized: true
        }).sort({ createdAt: -1 });

        const totalTests = results.length;

        if (totalTests === 0) {
            return res.status(200).json({
                success: true,
                stats: {
                    totalTests: 0,
                    averageScore: 0,
                    bestScore: 0,
                    currentTier: "Observer",
                    recentGames: []
                }
            });
        }

        // Calculate Average Score
        const totalScore = results.reduce((acc, r) => acc + (r.finalScore || 0), 0);
        const averageScore = Math.round(totalScore / totalTests);

        // Find Best Score
        const bestScore = Math.max(...results.map(r => r.finalScore || 0));

        const { BADGE_TIERS } = require("../ai-agents/ranking/rankEngine");

        // Get Most Recent Tier Key
        const currentTierKey = results[0].badge || results[0].rank?.tier || "observer";
        const currentBadgeProps = BADGE_TIERS[currentTierKey] || BADGE_TIERS.observer;

        // Get recent history (last 5 games)
        const recentGames = results.slice(0, 5).map(r => ({
            id: r._id,
            sessionId: r.sessionId, // Added for review link
            date: r.createdAt,
            score: r.finalScore,
            tier: r.badge || r.rank?.tier,
            profile: r.rank?.field || "General Assessment",
            integrity: r.trustScore || 100,
            verified: (r.trustScore || 100) >= 85
        }));

        // Calculate improvement
        let improvement = 0;
        if (totalTests >= 2) {
            const latestScore = results[0].finalScore || 0;
            const previousScore = results[1].finalScore || 0;
            improvement = latestScore - previousScore;
        }

        // Get percentile from latest result
        const percentile = results[0]?.rank?.globalPercentile || Math.min(99, Math.round(bestScore / 10));

        res.status(200).json({
            success: true,
            stats: {
                totalTests,
                averageScore,
                bestScore,
                currentTier: {
                    name: currentBadgeProps.name,
                    emoji: currentBadgeProps.emoji,
                    color: currentBadgeProps.color,
                    description: currentBadgeProps.description
                },
                improvement,
                percentile,
                recentGames
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get full test history
// @route   GET /api/dashboard/history
// @access  Private
const getTestHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const results = await IntelligenceResult.find({
            $or: [
                { userId: userId.toString() },
                { userId: userId }
            ],
            isFinalized: true
        })
            .sort({ createdAt: -1 })
            .select("finalScore badge rank createdAt");

        res.status(200).json({
            success: true,
            count: results.length,
            history: results.map(r => ({
                id: r._id,
                score: r.finalScore,
                tier: r.badge || r.rank?.tier,
                date: r.createdAt,
                profile: r.rank?.field || "General"
            }))
        });
    } catch (error) {
        console.error("Dashboard History Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get integrity events (Admin)
// @route   GET /api/dashboard/integrity-events
// @access  Private (Admin)
const getIntegrityEvents = async (req, res) => {
    try {
        const { userId, severity, limit = 50 } = req.query;

        // Build filter
        const filter = {};
        if (userId) filter.userId = userId;
        if (severity) filter.severity = severity;

        const events = await IntegrityEvent.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'name email');

        res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error("Integrity Events Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get AI metrics (Admin)
// @route   GET /api/dashboard/ai-metrics
// @access  Private (Admin)
const getAIMetrics = async (req, res) => {
    try {
        const { model, operation, limit = 50 } = req.query;

        // Build filter
        const filter = {};
        if (model) filter.model = model;
        if (operation) filter.operation = operation;

        const metrics = await AIMetrics.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        // Calculate aggregate stats
        const stats = await AIMetrics.aggregate([
            {
                $group: {
                    _id: "$model",
                    avgLatency: { $avg: "$latencyMs" },
                    totalTokens: { $sum: "$tokenCount.total" },
                    successRate: {
                        $avg: { $cond: ["$success", 1, 0] }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats,
            metrics
        });
    } catch (error) {
        console.error("AI Metrics Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getDashboardStats,
    getTestHistory,
    getCareerAdvice,
    getIntegrityEvents,
    getAIMetrics
};
