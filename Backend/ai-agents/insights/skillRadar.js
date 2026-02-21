// ai-agents/insights/skillRadar.js
export function buildSkillRadar(normalizedAnswers) {
  return Object.entries(normalizedAnswers).map(
    ([skill, value]) => ({
      skill,
      value,
      max: 10,
    })
  );
}
skillRadar: buildSkillRadar(result.normalizedAnswers)
