const { calculateTrustScore } = require("../ai-agents/trust/trustEngine.js");

exports.updateTrust = (user, metrics) => {
  // metrics: { attempts, difficultyHistory, scoreHistory, timeGaps }
  const hls = calculateTrustScore(metrics);

  user.humanLikelihood = user.humanLikelihood * 0.7 + hls * 0.3;

  if (user.humanLikelihood < 40) user.trustLevel = 'low';
  else if (user.humanLikelihood < 70) user.trustLevel = 'medium';
  else user.trustLevel = 'high';
};
