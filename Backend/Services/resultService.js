const IntelligenceResult = require("../models/IntelligenceResult.js");
const crypto = require("crypto");

/**
 * Generate a deterministic, collision-safe slug
 * Format: "semantic-description-4charhash"
 * Example: "elite-analytical-strategist-a3f2"
 */
function generateSlug(thinkingStyle) {
  if (!thinkingStyle) {
    thinkingStyle = "user-result";
  }

  // Semantic part: thinking style
  const semantic = String(thinkingStyle)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 32);

  // Hash part: uniqueness (4 hex chars)
  const hash = crypto.randomBytes(2).toString("hex");

  return `${semantic}-${hash}`;
}

/**
 * Save complete evaluation result with all metadata and slug
 */
async function saveEvaluationResult({
  sessionId,
  userId,
  country,
  finalScore,
  normalizedScore,
  difficulty,
  trustScore,
  badge,
  testHash,
  profile,      // { thinkingStyle, strengths, cognitiveBiases, summary }
  rank,          // { tier, globalPercentile, globalRank, countryRank, field }
  insights,      // { headline, summary }
  testDetail,    // { questions: [], totalQuestions, correctCount, completionTime }
  meta,          // { integrityScore, cheatingFlags, timeLeft, timeTaken, reactionTimes }
  behaviorAnalysis, // { rawTelemetryCount, focusLossRate, latencyVariance, integrityMultiplier, confidenceLevel, signals }
  reflexMetrics     // { reactionTimeMs, accuracyScore, ... }
}) {
  try {
    // Generate unique slug
    const slug = generateSlug(profile?.thinkingStyle);
    const share = {
      slug,
      headline: insights?.headline || "Global Intelligence Ranking",
    };

    // Create result document
    const result = await IntelligenceResult.create({
      sessionId,
      userId,
      country,

      share,
      profile: {
        thinkingStyle: profile?.thinkingStyle || "Analyst",
        strengths: profile?.strengths || [],
        cognitiveBiases: profile?.cognitiveBiases || [],
        summary: profile?.summary || "AI evaluation result",
      },
      rank: {
        tier: rank?.tier || badge || "Gold",
        globalPercentile: rank?.globalPercentile || 50,
        globalRank: rank?.globalRank || 1,
        countryRank: rank?.countryRank || 1,
        field: rank?.field || "developer",
      },

      finalScore,
      normalizedScore,
      difficulty,
      trustScore,
      badge,
      testHash,

      testDetail,
      meta,
      behaviorAnalysis,
      reflexMetrics,

      isFinalized: true,
      createdAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Error saving evaluation result:", error);
    throw error;
  }
}

/**
 * Retrieve result by slug (for OG image generation and public share pages)
 */
async function getResultBySlug(slug) {
  try {
    if (!slug) return null;

    const result = await IntelligenceResult.findOne({
      "share.slug": String(slug).toLowerCase(),
      isFinalized: true,
    });

    return result;
  } catch (error) {
    console.error("Error fetching result by slug:", error);
    throw error;
  }
}

/**
 * Retrieve result by session ID (for frontend after evaluation)
 */
async function getResultBySessionId(sessionId) {
  try {
    if (!sessionId) return null;

    const result = await IntelligenceResult.findOne({
      sessionId,
      isFinalized: true,
    }).sort({ createdAt: -1 });

    return result;
  } catch (error) {
    console.error("Error fetching result by session ID:", error);
    throw error;
  }
}

/**
 * Retrieve latest result by user ID
 */
async function getLatestResultByUserId(userId) {
  try {
    if (!userId) return null;

    const result = await IntelligenceResult.findOne({
      userId,
      isFinalized: true,
    }).sort({ createdAt: -1 });

    return result;
  } catch (error) {
    console.error("Error fetching latest result:", error);
    throw error;
  }
}

module.exports = {
  generateSlug,
  saveEvaluationResult,
  getResultBySlug,
  getResultBySessionId,
  getLatestResultByUserId,
};
