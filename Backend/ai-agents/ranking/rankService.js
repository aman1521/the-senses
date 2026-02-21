// ai-agents/ranking/rankService.js
const { computeNormalizedScore, computePercentile, getBadge, getTrustScore, getRankingMessage } = require("./rankEngine.js");

async function generateUserRank({
  userId,
  country,
  finalScore,
  difficulty,
  jobProfile,
}) {
  const normalizedScore = computeNormalizedScore({
    finalScore,
    difficulty,
    jobProfile,
  });

  // Calculate percentile (mock dataset - would use real data with DB)
  const mockScores = [normalizedScore];
  const percentile = computePercentile(normalizedScore, mockScores);
  
  // Get badge tier
  const badge = getBadge(percentile);
  
  // Get trust score
  const trustScore = getTrustScore(normalizedScore, percentile);
  
  // Get encouraging message
  const message = getRankingMessage(percentile, badge.name);

  return {
    globalRank: 1,
    countryRank: 1,
    percentile: percentile,
    normalizedScore: normalizedScore,
    country: country,
    badge: {
      tier: badge.tier,
      emoji: badge.emoji,
      name: badge.name,
      color: badge.color,
    },
    trustScore: trustScore,
    message: message,
  };
}

module.exports = { generateUserRank };
