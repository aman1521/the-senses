const Duel = require("../../models/Duel.js");
const { determineDuelWinner } = require("./duelEngine.js");

async function resolveDuel(duelId) {
    const duel = await Duel.findById(duelId);
    if (!duel) throw new Error("Duel not found");

    if (
        !duel.challengerResult ||
        !duel.opponentResult
    ) {
        throw new Error("Both players must complete duel");
    }

    const winnerKey = determineDuelWinner({
        challenger: duel.challengerResult,
        opponent: duel.opponentResult,
    });

    if (!winnerKey) return duel; // tie

    duel.winner =
        winnerKey === "challenger"
            ? duel.challenger
            : duel.opponent;

    duel.status = "completed";
    await duel.save();

    return duel;
}

module.exports = { resolveDuel };
