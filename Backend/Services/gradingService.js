// Rule-based + AI hybrid scoring
function rubricScore(answer = "") {
  const txt = String(answer || "").toLowerCase();
  const bins = { pattern: 0, logic: 0, problem: 0, creativity: 0, adapt: 0 };

  // light heuristics
  if (/\b(therefore|hence|thus|because)\b/.test(txt)) bins.logic += 8;
  if (/\bpattern|sequence|series|n\+|n\^|fibonacci\b/.test(txt)) bins.pattern += 8;
  if (/\btradeoff|constraint|edge case|fallback\b/.test(txt)) bins.problem += 8;
  if (txt.length > 140) bins.creativity += 8;
  if (/\biterate|pivot|hypothesis|mvp|A\/B\b/i.test(answer)) bins.adapt += 8;

  // normalize to 0-100
  const raw = bins.pattern + bins.logic + bins.problem + bins.creativity + bins.adapt;
  const base = Math.min(60, raw);
  return { bins, base };
}

function tierFromScore(total) {
  if (total >= 85) return "Strategic Genius";
  if (total >= 65) return "Smart Executor";
  if (total >= 45) return "Routine Thinker";
  return "Slow Thinker";
}

module.exports = { rubricScore, tierFromScore };
