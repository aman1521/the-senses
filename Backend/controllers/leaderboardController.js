// controllers/leaderboardController.js
const User = require("../models/User");
const Attempt = require("../models/Attempt");

// GET /api/leaderboard/dimension?dimension=logic&limit=10
exports.byDimension = async (req, res) => {
  try {
    const { dimension = "logic", limit = 10 } = req.query;
    // compute per-user average bin score (from Attempts)
    const ag = await Attempt.aggregate([
      { $match: { "rubric.bins": { $exists: true } } },
      { $project: { user: 1, score: 1, bins: "$rubric.bins" } },
      {
        $group: {
          _id: "$user",
          avgBin: { $avg: { $ifNull: [`$rubric.bins.${dimension}`, 0] } },
          avgScore: { $avg: "$score" },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { avgBin: -1, avgScore: -1 } },
      { $limit: Number(limit) }
    ]);
    // join user names
    const users = await User.find({ _id: { $in: ag.map(a => a._id) } });
    const usersMap = {};
    users.forEach(u => usersMap[String(u._id)] = u);
    const rows = ag.map(a => ({
      userId: a._id, name: usersMap[String(a._id)]?.name || 'Unknown', avgBin: a.avgBin, avgScore: a.avgScore, attempts: a.attempts
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/leaderboard (Global High Scores with Trust Data)
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { verifiedOnly, minTrustScore, badge, jobProfile } = req.query;

    // Import IntelligenceResult model
    const IntelligenceResult = require("../models/IntelligenceResult");
    const { BADGE_TIERS } = require("../ai-agents/ranking/rankEngine");

    // Anti-abuse: Only highest normalized score per user counts
    const aggregationPipeline = [];

    // Filter by Job Profile / Category if requested
    if (jobProfile && jobProfile !== 'global') {
      aggregationPipeline.push({ $match: { "rank.field": jobProfile } });
    }

    aggregationPipeline.push(
      {
        $sort: { normalizedScore: -1, trustScore: -1, createdAt: 1 }
      },
      {
        $group: {
          _id: "$userId",
          best: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$best" }
      },
      {
        $sort: { normalizedScore: -1, trustScore: -1 }
      },
      {
        $limit: 50
      }
    );

    const topResults = await IntelligenceResult.aggregate(aggregationPipeline);

    // Get user details
    // User model is already imported at the top of the file
    const userIds = topResults.map(r => r.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name trustLevel humanLikelihood');

    const usersMap = {};
    users.forEach(u => usersMap[String(u._id)] = u);

    // Build leaderboard data
    let leaderboardData = topResults.map(result => {
      const user = usersMap[String(result.userId)] || {};

      // Calculate percentile (simplified)
      const percentile = Math.min(100, Math.round(result.normalizedScore * 0.9));

      // Determine badge tier
      let badgeTier = BADGE_TIERS.starter;
      for (const [key, tier] of Object.entries(BADGE_TIERS)) {
        if (percentile >= tier.min) {
          badgeTier = { ...tier, tier: key };
          break;
        }
      }

      return {
        _id: result.userId,
        name: user.name || 'Unknown',
        jobProfile: result.rank?.field || result.jobProfile || "General",
        score: result.finalScore || result.normalizedScore,
        normalizedScore: result.normalizedScore,
        trustScore: result.trustScore || 50, // Critical for frontend using `user.trustScore`
        trust: {
          level: user.trustLevel || 'medium',
          score: result.trustScore || 50,
          label: (result.trustScore || 50) >= 80 ? "High Trust" : (result.trustScore || 50) >= 50 ? "Medium Trust" : "Low Trust",
          isVerified: (result.trustScore || 50) >= 80,
        },
        badge: {
          tier: result.badge || badgeTier.tier,
          emoji: badgeTier.emoji,
          name: badgeTier.name,
          color: badgeTier.color,
        },
        percentile,
      };
    });

    // Apply filters
    if (verifiedOnly === 'true') {
      leaderboardData = leaderboardData.filter(u => u.trust.isVerified);
    }

    if (minTrustScore) {
      leaderboardData = leaderboardData.filter(u => u.trust.score >= Number(minTrustScore));
    }

    if (badge) {
      leaderboardData = leaderboardData.filter(u => u.badge.tier === badge);
    }

    // Take top 50 (not 10, more fun)
    const topUsers = leaderboardData.slice(0, 50);

    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
