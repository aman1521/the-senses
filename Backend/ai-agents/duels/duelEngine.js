// ai-agents/duels/duelEngine.js

function determineDuelWinner({ challenger, opponent }) {
    // Trust-weighted score
    const challengerPower =
        challenger.normalizedScore * (challenger.trustScore / 100);

    const opponentPower =
        opponent.normalizedScore * (opponent.trustScore / 100);

    if (challengerPower === opponentPower) return null;

    return challengerPower > opponentPower
        ? "challenger"
        : "opponent";
}

module.exports = { determineDuelWinner };
