// core/scorePipeline.js
// Full Scoring Engine Implementation
// Final authority for how a test score is calculated, normalized, and validated.

const DIFFICULTY_MULTIPLIERS = {
    easy: { weight: 0.85, bonus: 0 },
    medium: { weight: 1.0, bonus: 5 },
    hard: { weight: 1.15, bonus: 12 },
};

const PROFILE_BONUSES = {
    developer: 5,
    designer: 4,
    product: 4,
    marketer: 3,
    data_scientist: 5,
    founder: 3,
    finance: 4,
    hr: 2,
    default: 0,
};

/**
 * finalizeScores — Single source of truth for score computation.
 * 
 * Score formula:
 *   normalizedScore = (finalScore × difficultyWeight)
 *                   + difficultyBonus
 *                   + profileBonus
 *                   + visionBonus (if vision test performed)
 *                   + reflexBonus (if reflex metrics available)
 *                   - integrityPenalty (if behavioral flags found)
 *
 * Result is clamped to [0, 100].
 * 
 * @param {Object} ctx - Evaluation context
 */
function finalizeScores(ctx) {
    if (ctx.results.finalScore == null) {
        throw new Error("Final score missing — cannot finalize.");
    }

    const difficulty = ctx.test?.difficulty || 'medium';
    const jobProfile = ctx.test?.jobProfile || 'default';

    const diffConfig = DIFFICULTY_MULTIPLIERS[difficulty] || DIFFICULTY_MULTIPLIERS.medium;
    const profileBonus = PROFILE_BONUSES[jobProfile] ?? PROFILE_BONUSES.default;

    // Base normalized score from AI grading
    let normalized = (ctx.results.finalScore * diffConfig.weight) + diffConfig.bonus + profileBonus;

    // Vision Harmony Bonus (Motor intelligence integration)
    // visionScore is 0-100 mapped to 0-5 bonus points
    if (ctx.results.visionScore != null && ctx.results.visionScore > 0) {
        const visionBonus = Math.round((ctx.results.visionScore / 100) * 5);
        normalized += visionBonus;
        ctx.results.visionBonus = visionBonus;
    }

    // Reflex/Attention Bonus
    // reflexScore is 0.0-1.0 mapped to 0-5 bonus points
    if (ctx.results.reflexMetrics?.reflexScore != null) {
        const reflexBonus = Math.round(ctx.results.reflexMetrics.reflexScore * 5);
        normalized += reflexBonus;
        ctx.results.reflexBonus = reflexBonus;
    }

    // Behavioral Integrity Penalty
    // integrityMultiplier 1.0 → no penalty, 0.5 → -50% of final score adjustment
    if (ctx.results.behaviorAnalysis?.integrityMultiplier != null) {
        const multiplier = ctx.results.behaviorAnalysis.integrityMultiplier;
        if (multiplier < 1.0) {
            const penalty = Math.round(normalized * (1.0 - multiplier) * 0.5); // Penalty is 50% of the theoretical loss
            normalized -= penalty;
            ctx.results.integrityPenalty = penalty;
        }
    }

    // Clamp final score to [0, 100]
    ctx.results.normalizedScore = Math.min(100, Math.max(0, Math.round(normalized)));

    return ctx;
}

module.exports = { finalizeScores, DIFFICULTY_MULTIPLIERS, PROFILE_BONUSES };
