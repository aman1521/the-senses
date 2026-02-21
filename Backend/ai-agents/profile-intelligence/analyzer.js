function analyzeIntelligence({
    answers,
    jobProfile,
    difficulty = "medium",
}) {
    let score = 0;

    Object.values(answers).forEach(v => (score += v));

    const difficultyMultiplier =
        difficulty === "hard" ? 1.3 :
            difficulty === "easy" ? 1.0 : 1.1;

    let profileBoost = 1;

    if (jobProfile === "developer") profileBoost = 1.2;
    if (jobProfile === "designer") profileBoost = 1.15;
    if (jobProfile === "marketer") profileBoost = 1.1;

    const baseScore = Math.round(score * difficultyMultiplier);
    const finalRuleScore = Math.min(
        100,
        Math.round(baseScore * profileBoost)
    );

    return finalRuleScore;
}

module.exports = { analyzeIntelligence };
