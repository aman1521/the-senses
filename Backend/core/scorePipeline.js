// core/scorePipeline.js

function finalizeScores(ctx) {
    if (ctx.results.finalScore == null) {
        throw new Error("Final score missing");
    }

    ctx.results.normalizedScore =
        ctx.results.finalScore +
        (ctx.test.difficulty === "hard" ? 10 : 0);

    return ctx;
}

module.exports = { finalizeScores };
