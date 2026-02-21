// ai-agents/ranking/rankEngine.js

const DIFFICULTY_WEIGHT = {
  easy: 0,
  medium: 5,
  hard: 10,
};

const PROFILE_WEIGHT = {
  developer: 5,
  designer: 3,
  marketer: 2,
  default: 0,
};

// Badge tiers based on percentile - FLEX TIER SYSTEM (Phase 2)
// Designed for virality: brutal but addictive, status-driven
const BADGE_TIERS = {
  outlier: {
    min: 99,
    emoji: "🌌",
    name: "Outlier",
    color: "#B300FF",
    description: "Top 1% of all minds",
    shareText: "Outlier — Top 1%"
  },
  top1: {
    min: 95,
    emoji: "💎",
    name: "Top 1%",
    color: "#FFD700",
    description: "Elite tier performance",
    shareText: "Top 1% — Elite"
  },
  eliteMind: {
    min: 85,
    emoji: "🧠",
    name: "Elite Mind",
    color: "#00D9FF",
    description: "Top 15% globally",
    shareText: "Elite Mind — Top 15%"
  },
  strategist: {
    min: 65,
    emoji: "♟️",
    name: "Strategist",
    color: "#9333EA",
    description: "Top 35% globally",
    shareText: "Strategist — Top 35%"
  },
  analyst: {
    min: 40,
    emoji: "📊",
    name: "Analyst",
    color: "#6366F1",
    description: "Top 60% globally",
    shareText: "Analyst — Top 60%"
  },
  observer: {
    min: 0,
    emoji: "👁️",
    name: "Observer",
    color: "#71717A",
    description: "Building foundations",
    shareText: "Observer — Developing"
  },
};

function computeNormalizedScore({
  finalScore,
  difficulty,
  jobProfile,
}) {
  return (
    finalScore +
    (DIFFICULTY_WEIGHT[difficulty] || 0) +
    (PROFILE_WEIGHT[jobProfile] || PROFILE_WEIGHT.default)
  );
}

function computePercentile(userScore, allScores) {
  if (allScores.length === 0) return 100;
  const below = allScores.filter(s => s < userScore).length;
  const percentile = Math.round((below / allScores.length) * 100);
  return Math.min(100, Math.max(0, percentile));
}

function getBadge(percentile) {
  for (const [key, tier] of Object.entries(BADGE_TIERS)) {
    if (percentile >= tier.min) {
      return {
        tier: key,
        emoji: tier.emoji,
        name: tier.name,
        color: tier.color,
        description: tier.description,
        shareText: tier.shareText,
        percentile,
      };
    }
  }
  return {
    ...BADGE_TIERS.observer,
    tier: 'observer',
    percentile,
  };
}

function getTrustScore(normalizedScore, percentile) {
  // Trust score indicates confidence in ranking (0-100)
  const scoreConfidence = Math.min(100, normalizedScore);
  const percentileConfidence = percentile >= 50 ? 100 : (percentile * 2);
  return Math.round((scoreConfidence + percentileConfidence) / 2);
}

function getRankingMessage(percentile, badgeTier) {
  // Status-driven messages designed for sharing
  const messages = {
    outlier: "🌌 Exceptional. You're in the top 1% of all participants.",
    top1: "💎 Elite performance. You outperformed 95% of users.",
    eliteMind: "🧠 Impressive. You're in the top 15% globally.",
    strategist: "♟️ Strong performance. Top 35% of all minds.",
    analyst: "📊 Above average. You're in the top 60%.",
    observer: "👁️ Starting point. Room to climb.",
  };

  return messages[badgeTier] || "Keep pushing forward.";
}

module.exports = {
  computeNormalizedScore,
  computePercentile,
  getBadge,
  getTrustScore,
  getRankingMessage,
  BADGE_TIERS,
};
