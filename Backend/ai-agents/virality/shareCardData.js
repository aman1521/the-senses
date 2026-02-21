// ai-agents/virality/shareCardData.js
export function buildShareCardData({
  user,
  finalScore,
  ranking,
  insights,
}) {
  return {
    name: user.name || "Anonymous",
    jobProfile: user.jobProfile,
    score: finalScore,
    globalRank: ranking.globalRank,
    percentile: ranking.percentile,
    headline:
      insights?.summary ||
      "AI-evaluated intelligence result",
  };
}
