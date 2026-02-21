// core/invariants.js

function enforceInvariants(ctx) {
    if (ctx.results.finalScore > 100)
        throw new Error("Score invariant violated");

    if (ctx.results.trustScore > 100)
        ctx.results.trustScore = 100;

    if (ctx.results.trustScore < 40)
        ctx.results.badge = "Unverified";

    if (
        ctx.results.trustScore < 40 &&
        ctx.meta.duelMode
    ) {
        throw new Error("Low trust users cannot duel");
    }

    return ctx;
}

module.exports = { enforceInvariants };
