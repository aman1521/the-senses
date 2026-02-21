/**
 * Calculates the user's Cognitive Archetype based on test performance and metadata.
 * 
 * @param {object} params
 * @param {number} params.finalScore - The final normalized score (0-100)
 * @param {string} params.baseBadge - The tier badge (e.g. "Gold", "Silver")
 * @param {object} params.meta - Test metadata (reaction times, memory score, etc.)
 * @returns {string} The calculated archetype name
 */
function calculateArchetype({ finalScore, baseBadge, meta = {} }) {
    let archetype = baseBadge || "Analyst";

    const avgReaction = meta.reactionTimes?.length > 0
        ? meta.reactionTimes.reduce((a, b) => a + b, 0) / meta.reactionTimes.length
        : 0;

    if (avgReaction > 0 && avgReaction < 450 && finalScore > 80) {
        archetype = "Rapid Strategist";
    } else if (meta.memoryScore > 40 && finalScore > 85) {
        archetype = "Visionary Architect";
    } else if (avgReaction > 0 && avgReaction < 400) {
        archetype = "Quick Thinker";
    } else if (meta.memoryScore > 50) {
        archetype = "Visual Savant";
    }

    return archetype;
}

module.exports = { calculateArchetype };
