// controllers/analyticsController.js
// Phase 6: Advanced Analytics — Company Dashboard Reporting

const IntelligenceResult = require('../models/IntelligenceResult');
const User = require('../models/User');
const Attempt = require('../models/Attempt');

/**
 * GET /api/v1/analytics/company/:orgId
 * Company-wide aggregate analytics report
 */
exports.getCompanyAnalytics = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { period = '30d', jobProfile } = req.query;

        const daysAgo = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        // Get all users in the org
        const orgUsers = await User.find({ organization: orgId }).select('_id name username profilePicture').lean();
        const orgUserIds = orgUsers.map(u => u._id.toString());

        if (orgUserIds.length === 0) {
            return res.json({ success: true, data: _emptyAnalytics() });
        }

        const matchQuery = {
            userId: { $in: orgUserIds },
            isFinalized: true,
            createdAt: { $gte: since }
        };
        if (jobProfile && jobProfile !== 'all') {
            matchQuery['rank.field'] = jobProfile;
        }

        // 1. Score Distribution (histogram buckets)
        const scoreDistribution = await IntelligenceResult.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $multiply: [{ $floor: { $divide: ['$normalizedScore', 10] } }, 10] },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Score Trend Over Time (daily average)
        const scoreTrend = await IntelligenceResult.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    avgScore: { $avg: '$normalizedScore' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Top Performers
        const topResultDocs = await IntelligenceResult.aggregate([
            { $match: { userId: { $in: orgUserIds }, isFinalized: true } },
            { $sort: { normalizedScore: -1, trustScore: -1 } },
            { $group: { _id: '$userId', best: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$best' } },
            { $sort: { normalizedScore: -1 } },
            { $limit: 5 }
        ]);

        const topPerformers = topResultDocs.map(r => {
            const user = orgUsers.find(u => u._id.toString() === r.userId?.toString());
            return {
                userId: r.userId,
                name: user?.name || 'Unknown',
                avatar: user?.profilePicture,
                score: r.normalizedScore,
                badge: r.badge,
                jobProfile: r.rank?.field
            };
        });

        // 4. Dimension Breakdown (via Attempts)
        const dimensionStats = await Attempt.aggregate([
            { $match: { user: { $in: orgUsers.map(u => u._id) } } },
            {
                $group: {
                    _id: null,
                    avgLogic: { $avg: '$rubric.bins.logic' },
                    avgCreativity: { $avg: '$rubric.bins.creativity' },
                    avgEmpathy: { $avg: '$rubric.bins.empathy' },
                    avgSystems: { $avg: '$rubric.bins.systemsThinking' },
                    avgComm: { $avg: '$rubric.bins.communication' },
                    totalAttempts: { $sum: 1 }
                }
            }
        ]);

        // 5. Trust and Integrity Summary
        const integrityStats = await IntelligenceResult.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    avgTrust: { $avg: '$trustScore' },
                    avgIntegrityMultiplier: { $avg: '$behaviorAnalysis.integrityMultiplier' },
                    highRiskCount: { $sum: { $cond: [{ $lt: ['$behaviorAnalysis.integrityMultiplier', 0.8] }, 1, 0] } },
                    totalCount: { $sum: 1 }
                }
            }
        ]);

        const dim = dimensionStats[0] || {};
        const integrity = integrityStats[0] || {};

        res.json({
            success: true,
            data: {
                period,
                totalCandidates: orgUserIds.length,
                totalTests: integrity.totalCount || 0,
                avgScore: Math.round(
                    topResultDocs.reduce((s, r) => s + (r.normalizedScore || 0), 0) / Math.max(topResultDocs.length, 1)
                ),
                scoreDistribution: scoreDistribution.map(b => ({
                    bucket: `${b._id}–${b._id + 9}`,
                    count: b.count
                })),
                scoreTrend: scoreTrend.map(d => ({
                    date: d._id,
                    avgScore: Math.round(d.avgScore),
                    count: d.count
                })),
                topPerformers,
                dimensions: {
                    logic: Math.round(dim.avgLogic || 0),
                    creativity: Math.round(dim.avgCreativity || 0),
                    empathy: Math.round(dim.avgEmpathy || 0),
                    systemsThinking: Math.round(dim.avgSystems || 0),
                    communication: Math.round(dim.avgComm || 0),
                    totalAttempts: dim.totalAttempts || 0
                },
                integrity: {
                    avgTrustScore: Math.round(integrity.avgTrust || 0),
                    avgIntegrityMultiplier: parseFloat((integrity.avgIntegrityMultiplier || 1).toFixed(2)),
                    highRiskCount: integrity.highRiskCount || 0,
                    highRiskPercent: integrity.totalCount
                        ? Math.round((integrity.highRiskCount / integrity.totalCount) * 100)
                        : 0
                }
            }
        });
    } catch (err) {
        console.error('[Analytics] getCompanyAnalytics:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /api/v1/analytics/candidate/:userId
 * Single candidate deep analytics
 */
exports.getCandidateAnalytics = async (req, res) => {
    try {
        const { userId } = req.params;

        const results = await IntelligenceResult
            .find({ userId, isFinalized: true })
            .sort({ createdAt: 1 })
            .lean();

        if (results.length === 0) {
            return res.json({ success: true, data: { results: [], trend: [] } });
        }

        const trend = results.map(r => ({
            date: r.createdAt,
            score: r.normalizedScore,
            trustScore: r.trustScore,
            badge: r.badge,
            difficulty: r.difficulty
        }));

        const latest = results[results.length - 1];
        const first = results[0];
        const improvement = results.length >= 2
            ? Math.round(latest.normalizedScore - first.normalizedScore)
            : 0;

        const attempts = await Attempt.find({ user: userId }).lean();
        const dims = attempts.reduce(
            (acc, a) => {
                acc.logic += a.rubric?.bins?.logic || 0;
                acc.creativity += a.rubric?.bins?.creativity || 0;
                acc.empathy += a.rubric?.bins?.empathy || 0;
                acc.systems += a.rubric?.bins?.systemsThinking || 0;
                acc.comm += a.rubric?.bins?.communication || 0;
                acc.count += 1;
                return acc;
            },
            { logic: 0, creativity: 0, empathy: 0, systems: 0, comm: 0, count: 0 }
        );
        const n = Math.max(dims.count, 1);

        res.json({
            success: true,
            data: {
                testCount: results.length,
                improvement,
                bestScore: Math.max(...results.map(r => r.normalizedScore)),
                latestScore: latest.normalizedScore,
                latestBadge: latest.badge,
                trend,
                dimensions: {
                    logic: Math.round(dims.logic / n),
                    creativity: Math.round(dims.creativity / n),
                    empathy: Math.round(dims.empathy / n),
                    systemsThinking: Math.round(dims.systems / n),
                    communication: Math.round(dims.comm / n)
                },
                integrityHistory: results.map(r => ({
                    date: r.createdAt,
                    multiplier: r.behaviorAnalysis?.integrityMultiplier ?? 1,
                    cheatRisk: r.behaviorAnalysis?.cheatRisk
                }))
            }
        });
    } catch (err) {
        console.error('[Analytics] getCandidateAnalytics:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

function _emptyAnalytics() {
    return {
        totalCandidates: 0,
        totalTests: 0,
        avgScore: 0,
        scoreDistribution: [],
        scoreTrend: [],
        topPerformers: [],
        dimensions: { logic: 0, creativity: 0, empathy: 0, systemsThinking: 0, communication: 0, totalAttempts: 0 },
        integrity: { avgTrustScore: 0, avgIntegrityMultiplier: 1, highRiskCount: 0, highRiskPercent: 0 }
    };
}
