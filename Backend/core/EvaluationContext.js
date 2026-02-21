// core/EvaluationContext.js

function createEvaluationContext({
    user,
    answers,
    jobProfile,
    difficulty,
    meta
}) {
    return {
        userId: user._id,
        name: user.name || "Anonymous",
        country: user.country || "global",

        test: {
            jobProfile,
            difficulty,
            answers,
            violations: meta?.violations || 0
        },

        results: {
            ruleScore: null,
            aiScore: null,
            finalScore: null,
            normalizedScore: null,
            percentile: null,
            trustScore: null,
            badge: null,
        },

        meta: {
            createdAt: new Date(),
            version: "2.1",
            aiCalled: false,
        },
    };
}

module.exports = { createEvaluationContext };
