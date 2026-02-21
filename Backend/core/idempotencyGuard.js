// core/idempotencyGuard.js
const crypto = require("crypto");
const IntelligenceResult = require("../models/IntelligenceResult.js");

async function checkIdempotency(ctx) {
    const hash = crypto
        .createHash("sha256")
        .update(
            ctx.userId +
            JSON.stringify(ctx.test)
        )
        .digest("hex");

    const existing = await IntelligenceResult.findOne({
        userId: ctx.userId,
        testHash: hash,
    });

    return { existing, hash };
}

module.exports = { checkIdempotency };

