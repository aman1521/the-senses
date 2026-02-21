// ai-agents/llm/aiInsightEngine.js
import { callLLM } from "./llmClient.js";
import { buildIntelligencePrompt } from "./intelligencePrompt.js";

export async function generateAIInsights({
  answers,
  jobProfile,
  difficulty,
  ruleScore,
}) {
  const prompt = buildIntelligencePrompt({
    answers,
    jobProfile,
    difficulty,
    ruleScore,
  });

  const raw = await callLLM(prompt);

  try {
    return JSON.parse(raw);
  } catch {
    return {
      summary: "AI insight unavailable",
      strengths: [],
      weaknesses: [],
      improvement: "",
    };
  }
}
