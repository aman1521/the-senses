const User = require('../models/User');
const IntelligenceResult = require('../models/IntelligenceResult');
const Post = require('../models/Post');
const PostBubble = require('../models/PostBubble');

/**
 * Get candidate overview for company dashboard
 * CRITICAL: Only performance data, NO social metrics
 */
exports.getCandidateOverview = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const candidate = await User.findById(candidateId).select(
            'name username email profileType createdAt stats'
        );

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found'
            });
        }

        // Get latest intelligence result
        const latestResult = await IntelligenceResult.findOne({
            user: candidateId
        }).sort({ createdAt: -1 });

        // Get all results for trend analysis
        const allResults = await IntelligenceResult.find({
            user: candidateId
        }).sort({ createdAt: 1 }).select('score confidence_level createdAt');

        // Calculate performance metrics
        const performanceMetrics = {
            currentScore: latestResult?.score || 0,
            confidenceLevel: latestResult?.confidence_level || 'unknown',
            integrityMultiplier: latestResult?.behavioral_signals?.integrity_multiplier || 1.0,
            testsTaken: allResults.length,
            scoreHistory: allResults.map(r => ({
                score: r.score,
                date: r.createdAt
            })),
            consistency: calculateConsistency(allResults),
            growth: calculateGrowth(allResults)
        };

        res.json({
            success: true,
            candidate: {
                id: candidate._id,
                name: candidate.name,
                username: candidate.username,
                profileType: candidate.profileType,
                memberSince: candidate.createdAt
            },
            performance: performanceMetrics
        });

    } catch (error) {
        console.error('Get candidate overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch candidate data'
        });
    }
};

/**
 * Get candidate's public thinking (bubble participation)
 * CRITICAL: Content only, NO engagement metrics shown
 */
exports.getCandidateThinking = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { limit = 10 } = req.query;

        // Get bubbles the candidate participated in
        const userPosts = await Post.find({
            author: candidateId,
            bubble: { $ne: null },
            visibility: 'public'
        }).distinct('bubble');

        const bubbles = await PostBubble.find({
            _id: { $in: userPosts },
            status: 'active'
        })
            .populate('originPost')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // For each bubble, get candidate's contributions
        const thinkingData = await Promise.all(
            bubbles.map(async (bubble) => {
                const contributions = await Post.find({
                    author: candidateId,
                    bubble: bubble._id,
                    visibility: 'public'
                })
                    .populate('quotedPost')
                    .sort({ createdAt: -1 })
                    .limit(3)
                    .select('content createdAt quotedPost -engagement'); // EXCLUDE engagement

                return {
                    bubbleId: bubble._id,
                    topic: bubble.topicLabel,
                    contributions: contributions.map(c => ({
                        content: c.content,
                        date: c.createdAt,
                        quotedContext: c.quotedPost ? c.quotedPost.content : null
                    }))
                };
            })
        );

        res.json({
            success: true,
            thinking: thinkingData,
            note: 'Engagement metrics excluded from company view'
        });

    } catch (error) {
        console.error('Get candidate thinking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch thinking data'
        });
    }
};

/**
 * Compare candidates within same profile
 */
exports.compareCandidates = async (req, res) => {
    try {
        const { candidateIds, profileType } = req.body;

        if (!candidateIds || candidateIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 candidates required for comparison'
            });
        }

        const comparisons = await Promise.all(
            candidateIds.map(async (id) => {
                const candidate = await User.findById(id).select('name username profileType');

                if (profileType && candidate.profileType !== profileType) {
                    return null; // Skip if profile doesn't match
                }

                const latestResult = await IntelligenceResult.findOne({
                    user: id
                }).sort({ createdAt: -1 });

                const allResults = await IntelligenceResult.find({
                    user: id
                }).sort({ createdAt: 1 });

                return {
                    id: candidate._id,
                    name: candidate.name,
                    username: candidate.username,
                    profileType: candidate.profileType,
                    score: latestResult?.score || 0,
                    confidence: latestResult?.confidence_level || 'unknown',
                    consistency: calculateConsistency(allResults),
                    testCount: allResults.length
                };
            })
        );

        // Filter out nulls and sort by score
        const validComparisons = comparisons
            .filter(c => c !== null)
            .sort((a, b) => b.score - a.score);

        res.json({
            success: true,
            candidates: validComparisons,
            profileType: profileType || 'mixed'
        });

    } catch (error) {
        console.error('Compare candidates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to compare candidates'
        });
    }
};

/**
 * Get detailed performance breakdown
 */
exports.getPerformanceBreakdown = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const latestResult = await IntelligenceResult.findOne({
            user: candidateId
        }).sort({ createdAt: -1 });

        if (!latestResult) {
            return res.status(404).json({
                success: false,
                message: 'No test results found'
            });
        }

        // Extract detailed breakdown
        const breakdown = {
            overall: {
                score: latestResult.score,
                confidence: latestResult.confidence_level,
                timestamp: latestResult.createdAt
            },
            cognitive: {
                skillScore: latestResult.skill_score || 0,
                psychScore: latestResult.psych_score || 0,
                reflexScore: latestResult.reflex_metrics?.composite_score || 0,
                memoryScore: latestResult.memory_score || 0
            },
            behavioral: {
                integrityMultiplier: latestResult.behavioral_signals?.integrity_multiplier || 1.0,
                cheatRisk: latestResult.behavioral_signals?.cheat_risk || 'low',
                focusLoss: latestResult.behavioral_signals?.focus_loss_count || 0,
                pasteEvents: latestResult.behavioral_signals?.paste_count || 0
            },
            reliability: {
                videoVerified: latestResult.video_analysis?.verified || false,
                audioVerified: latestResult.audio_analysis?.verified || false,
                deviceAnomalies: latestResult.device_anomalies?.length || 0
            }
        };

        res.json({
            success: true,
            breakdown
        });

    } catch (error) {
        console.error('Get performance breakdown error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance breakdown'
        });
    }
};

// Helper functions
function calculateConsistency(results) {
    if (results.length < 2) return 'insufficient_data';

    const scores = results.map(r => r.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = higher consistency
    if (stdDev < 50) return 'high';
    if (stdDev < 100) return 'medium';
    return 'low';
}

function calculateGrowth(results) {
    if (results.length < 2) return 0;

    const first = results[0].score;
    const last = results[results.length - 1].score;

    return ((last - first) / first) * 100;
}
