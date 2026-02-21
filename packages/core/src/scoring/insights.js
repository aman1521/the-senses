/**
 * Insights and explanations for cognitive archetypes.
 */

const ARCHETYPES = {
    "Rapid Strategist": {
        strengths: ["Fast Decision Making", "Strategic Adaptability", "Pattern Recognition"],
        biases: ["Action Bias", "Overconfidence"],
        description: "You excel at making quick, accurate decisions under pressure."
    },
    "Visionary Architect": {
        strengths: ["Long-term Planning", "Structural thinking", "Creative Problem Solving"],
        biases: ["Analysis Paralysis", "Idealism"],
        description: "You see the big picture and design robust systems."
    },
    "Quick Thinker": {
        strengths: ["Speed", "Agility", "Crisis Management"],
        biases: ["Impulsivity", "Surface-level Analysis"],
        description: "Your reaction time is exceptional."
    },
    "Visual Savant": {
        strengths: ["Spatial Reasoning", "Memory", "Visual Processing"],
        biases: ["Pattern Overfitting", "Detail Obsession"],
        description: "You have an incredible visual memory."
    },
    "Analyst": {
        strengths: ["Data Analysis", "Logical Reasoning", "Consistency"],
        biases: ["Confirmation Bias", "Anchoring"],
        description: "You are methodical and logical."
    }
};

/**
 * Get profile insights based on archetype.
 * @param {string} archetype - one of the archetypes
 * @returns {object} { strengths: string[], biases: string[], description: string }
 */
function getInsights(archetype) {
    return ARCHETYPES[archetype] || ARCHETYPES["Analyst"];
}

module.exports = {
    getInsights,
    ARCHETYPES
};
