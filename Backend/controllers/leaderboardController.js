// controllers/leaderboardController.js
// Optimized Leaderboard with DB-driven aggregation and caching

const User = require("../models/User");
const IntelligenceResult = require("../models/IntelligenceResult");

// Simple in-memory cache — avoids hammering DB on every page load
// In production, replace with Redis
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const leaderboardCache = new Map(); // key -> { data, expiresAt }

function getCached(key) {
  const entry = leaderboardCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  leaderboardCache.delete(key);
  return null;
}
function setCache(key, data) {
  leaderboardCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// GET /api/v1/leaderboard/dimension?dimension=logic&limit=10
exports.byDimension = async (req, res) => {
  try {
    const Attempt = require("../models/Attempt");
    const { dimension = "logic", limit = 10 } = req.query;
    const safeLimit = Math.min(Number(limit) || 10, 100);

    const cacheKey = `dim:${dimension}:${safeLimit}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Aggregate per-user average for the requested dimension bin
    const ag = await Attempt.aggregate([
      { $match: { [`rubric.bins.${dimension}`]: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: "$user",
          avgBin: { $avg: `$rubric.bins.${dimension}` },
          avgScore: { $avg: "$score" },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { avgBin: -1, avgScore: -1 } },
      { $limit: safeLimit }
    ]);

    const userIds = ag.map(a => a._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name username profilePicture verified stats")
      .lean();

    const usersMap = {};
    users.forEach(u => (usersMap[String(u._id)] = u));

    const rows = ag.map(a => ({
      userId: a._id,
      name: usersMap[String(a._id)]?.name || "Unknown",
      username: usersMap[String(a._id)]?.username,
      avatar: usersMap[String(a._id)]?.profilePicture,
      verified: usersMap[String(a._id)]?.verified || false,
      avgBin: Math.round(a.avgBin),
      avgScore: Math.round(a.avgScore),
      attempts: a.attempts
    }));

    setCache(cacheKey, rows);
    res.json(rows);
  } catch (e) {
    console.error("[Leaderboard byDimension]", e.message);
    res.status(500).json({ error: e.message });
  }
};

// GET /api/v1/leaderboard/global?badge=...&verifiedOnly=true&minTrustScore=70&jobProfile=developer
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { verifiedOnly, minTrustScore, badge, jobProfile } = req.query;
    const { BADGE_TIERS } = require("../ai-agents/ranking/rankEngine");

    const cacheKey = `global:${jobProfile}:${badge}:${verifiedOnly}:${minTrustScore}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Build aggregation pipeline — best score per user only
    const pipeline = [];

    if (jobProfile && jobProfile !== "global") {
      pipeline.push({ $match: { "rank.field": jobProfile } });
    }

    // Only finalized results
    pipeline.push({ $match: { isFinalized: true } });

    pipeline.push(
      { $sort: { normalizedScore: -1, trustScore: -1, createdAt: 1 } },
      // Keep only the one best result per user
      { $group: { _id: "$userId", best: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$best" } },
      { $sort: { normalizedScore: -1, trustScore: -1 } },
      { $limit: 100 }
    );

    const topResults = await IntelligenceResult.aggregate(pipeline);

    // Compute total pool size for real percentile
    const totalCount = await IntelligenceResult.countDocuments({ isFinalized: true });

    // Fetch user profiles
    const userIds = topResults.map(r => r.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name username profilePicture verified trustLevel currentRole")
      .lean();

    const usersMap = {};
    users.forEach(u => (usersMap[String(u._id)] = u));

    // Build leaderboard rows
    let leaderboardData = topResults.map((result, index) => {
      const user = usersMap[String(result.userId)] || {};

      // Real percentile: rank out of totalCount
      const rankPosition = index + 1;
      const realPercentile = totalCount > 0
        ? Math.round(((totalCount - rankPosition) / totalCount) * 100)
        : 0;

      // Determine badge display
      let badgeTier = BADGE_TIERS.observer;
      for (const [key, tier] of Object.entries(BADGE_TIERS)) {
        if (realPercentile >= tier.min) {
          badgeTier = { ...tier, tier: key };
          break;
        }
      }

      return {
        _id: result.userId,
        name: user.name || "Unknown",
        username: user.username,
        avatar: user.profilePicture,
        verified: user.verified || false,
        currentRole: user.currentRole || result.rank?.field || "General",
        jobProfile: result.rank?.field || "General",
        score: result.finalScore || result.normalizedScore,
        normalizedScore: result.normalizedScore,
        trustScore: result.trustScore || 50,
        rank: rankPosition,
        percentile: realPercentile,
        trust: {
          level: user.trustLevel || "medium",
          score: result.trustScore || 50,
          label: (result.trustScore || 50) >= 80 ? "High Trust" : (result.trustScore || 50) >= 50 ? "Medium Trust" : "Low Trust",
          isVerified: (result.trustScore || 50) >= 80,
        },
        badge: {
          tier: result.badge || badgeTier.tier,
          emoji: badgeTier.emoji,
          name: result.badge || badgeTier.name,
          color: badgeTier.color,
        },
      };
    });

    // Apply filters
    if (verifiedOnly === "true") {
      leaderboardData = leaderboardData.filter(u => u.trust.isVerified);
    }
    if (minTrustScore) {
      leaderboardData = leaderboardData.filter(u => u.trust.score >= Number(minTrustScore));
    }
    if (badge) {
      leaderboardData = leaderboardData.filter(u => u.badge.tier === badge);
    }

    const topUsers = leaderboardData.slice(0, 50);
    setCache(cacheKey, topUsers);
    res.json(topUsers);
  } catch (err) {
    console.error("[Leaderboard Global]", err.message);
    res.status(500).json({ error: err.message });
  }
};
