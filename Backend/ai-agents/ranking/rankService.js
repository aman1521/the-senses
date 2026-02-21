// ai-agents/ranking/rankService.js
// Full Percentile Normalization using live DB data

const IntelligenceResult = require("../../models/IntelligenceResult");
const { computeNormalizedScore, computePercentile, getBadge, getTrustScore, getRankingMessage } = require("./rankEngine.js");

/**
 * Generates a full rank object for a user after they complete the test.
 * Uses live DB data for real percentile normalization.
 */
async function generateUserRank({ userId, country, finalScore, difficulty, jobProfile }) {
  const normalizedScore = computeNormalizedScore({ finalScore, difficulty, jobProfile });

  // --- LIVE PERCENTILE NORMALIZATION ---
  // Pull all existing normalized scores from DB (same field = same competitive pool)
  // We limit to 10,000 recent results for performance
  const allResultsDocs = await IntelligenceResult
    .find({ isFinalized: true, "rank.field": jobProfile })
    .sort({ createdAt: -1 })
    .limit(10000)
    .select("normalizedScore")
    .lean();

  const allScores = allResultsDocs.map(r => r.normalizedScore || 0);

  // Add self score to pool (candidate is competing with everyone including current run)
  allScores.push(normalizedScore);

  const percentile = computePercentile(normalizedScore, allScores);

  // Compute global rank position from DB
  const totalAbove = await IntelligenceResult.countDocuments({
    isFinalized: true,
    normalizedScore: { $gt: normalizedScore }
  });
  const globalRank = totalAbove + 1;

  // Country-specific rank
  const countryAbove = await IntelligenceResult.countDocuments({
    isFinalized: true,
    country: country || "global",
    normalizedScore: { $gt: normalizedScore }
  });
  const countryRank = countryAbove + 1;

  // --- History for trust computation ---
  const userHistory = await IntelligenceResult
    .find({ userId: userId?.toString(), isFinalized: true })
    .sort({ createdAt: 1 })
    .select("normalizedScore difficulty createdAt")
    .lean();

  const scoreHistory = userHistory.map(r => r.normalizedScore || 0);
  const diffHistory = userHistory.map(r => r.difficulty || "medium");
  const dates = userHistory.map(r => new Date(r.createdAt).getTime());
  const timeGaps = dates.slice(1).map((t, i) => (t - dates[i]) / (1000 * 60 * 60)); // hours

  const badge = getBadge(percentile);
  const trustScore = getTrustScore(normalizedScore, percentile);
  const message = getRankingMessage(percentile, badge.tier);

  return {
    globalRank,
    countryRank,
    percentile,
    normalizedScore,
    country: country || "global",
    badge: {
      tier: badge.tier,
      emoji: badge.emoji,
      name: badge.name,
      color: badge.color,
    },
    trustScore,
    message,
    // Pass history for trust computation in intelligence.js
    attempts: userHistory.length + 1,
    scoreHistory,
    difficultyHistory: diffHistory,
    timeGaps
  };
}

module.exports = { generateUserRank };
