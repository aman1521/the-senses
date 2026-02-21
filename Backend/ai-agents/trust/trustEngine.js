// ai-agents/trust/trustEngine.js

function calculateTrustScore({
  attempts,
  difficultyHistory = [],
  scoreHistory = [],
  timeGaps = [],
  violations = 0,
}) {
  let score = 100;

  // 0️⃣ Focus Integrity (Real-time Violations)
  // Each tab switch costs 15 points of trust transparency
  if (violations > 0) {
    score -= (violations * 15);
  }

  // 1️⃣ Difficulty consistency
  const hardAttempts = difficultyHistory.filter(d => d === "hard").length;
  const difficultyRatio = hardAttempts / difficultyHistory.length || 0;
  score -= (1 - difficultyRatio) * 30;

  // 2️⃣ Score stability (variance)
  if (scoreHistory.length >= 2) {
    const diffs = scoreHistory
      .slice(1)
      .map((s, i) => Math.abs(s - scoreHistory[i]));
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    if (avgDiff > 20) score -= 20;
  }

  // 3️⃣ Attempt count
  if (attempts < 3) score -= 20;
  else if (attempts >= 5) score += 5;

  // 4️⃣ Time gap abuse (rapid retries)
  const fastRetries = timeGaps.filter(g => g < 2).length; // minutes
  score -= fastRetries * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = { calculateTrustScore };
