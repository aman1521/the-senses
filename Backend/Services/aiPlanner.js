const { client, MODEL } = require("../config/Ai");

async function planFollowUp({ question, userAnswer, context, profile }) {
  const sys = `You are The Senses AI Brain: a strict yet helpful analyst.
Evaluate answer quality, show reasoning, give concise feedback (<=120 words),
and produce ONE adaptive follow-up that targets the user's weakest dimension.`;

  const prompt = `
Question: ${question?.prompt || ""}
User answer: ${userAnswer || ""}
Profile: ${JSON.stringify(profile || {})}
Knowledge:
${context || "(no extra context)"}

Return JSON:
{"feedback": "...", "followUp": "...", "dimension": "pattern|logic|problem|creativity|adapt"}
`;

  const r = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: prompt }
    ]
  });

  const txt = r.choices[0].message.content || "{}";
  try { return JSON.parse(txt); } catch { return { feedback: txt, followUp: "" }; }
}

async function generateTwistedQuestion({ domain, level, seedNotes, context }) {
  const sys = `You are a master test designer for The Senses. Create a sharply challenging question, not a generic one.`;
  const user = `
Domain: ${domain || "general"}
Level (1 easiest - 5 hardest): ${level || 3}
Seed notes: ${seedNotes || "-"}
Context (books/insights):
${context || "-"}

Output JSON with fields:
{
 "type": "logic|pattern|problem|creativity|adapt",
 "prompt": "one-paragraph question",
 "choices": [{"text":"...", "score": number, "next":"end"}]  // choices optional for non-MCQ
}
`;

  const r = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: sys }, { role: "user", content: user }]
  });

  try { return JSON.parse(r.choices[0].message.content); }
  catch { return null; }
}

module.exports = { planFollowUp, generateTwistedQuestion };
