// ai-agents/llm/intelligencePrompt.js
export function buildIntelligencePrompt({
  answers,
  jobProfile,
  difficulty,
  ruleScore,
}) {
  return `
User Job Profile: ${jobProfile}
Test Difficulty: ${difficulty}
Rule-Based Score: ${ruleScore}

User Skill Scores (0–10):
${Object.entries(answers)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

Tasks:
1. Briefly evaluate intelligence level.
2. Identify top 2 strengths.
3. Identify top 2 weaknesses.
4. Give 1 improvement suggestion.

Respond strictly in JSON with keys:
summary, strengths[], weaknesses[], improvement
`;
}
