// ai-agents/llm/llmClient.js
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function callLLM(prompt) {
  if (!openai) throw new Error("OpenAI API key not configured");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an intelligence evaluation expert." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}
