// controllers/aiStreamController.js
// SSE streaming: streams AI feedback token-by-token for a given question+answer
const fetch = require("node-fetch"); // if not installed, npm i node-fetch@2
const Question = require("../models/Question");
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const { embedOne } = require("../Services/embeddingService"); // optional RAG
const { retrieveContext } = require("../Services/ragService");

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// helper to set SSE headers
function setupSSE(res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();
}

async function streamOpenAI(req, res, prompt) {
  // using OpenAI streaming via fetch (chat completions with stream: true)
  // Adjust URL/model if needed
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: process.env.AI_MODEL || "gpt-4o-mini",
    messages: [{ role: "system", content: "You are a concise brain analyst." }, { role: "user", content: prompt }],
    stream: true,
    temperature: 0.4
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    timeout: 0
  });

  if (!resp.ok) {
    const txt = await resp.text();
    res.write(`event: error\ndata: ${JSON.stringify({ error: txt })}\n\n`);
    res.end();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // OpenAI sends chunks like: data: {json}\n\n  (and data: [DONE])
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // last may be incomplete

    for (const part of parts) {
      if (!part.trim()) continue;
      if (!part.startsWith("data:")) continue;
      const data = part.replace(/^data:\s*/, "").trim();
      if (data === "[DONE]") {
        res.write(`event: done\ndata: {}\n\n`);
        res.end();
        return;
      }
      try {
        const parsed = JSON.parse(data);
        // extract token text fragments from parsed (depends on model response structure)
        const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || "";
        // Send each delta as a "token" event
        res.write(`event: token\ndata: ${JSON.stringify({ token: delta })}\n\n`);
      } catch (e) {
        // non-json chunk; forward raw
        res.write(`event: token\ndata: ${JSON.stringify({ token: data })}\n\n`);
      }
    }
  }
  res.write(`event: done\ndata: {}\n\n`);
  res.end();
}

// POST /api/ai/stream
exports.streamAssist = async (req, res) => {
  try {
    const { userId, questionId, userAnswer } = req.body;
    if (!userId || !questionId || !userAnswer) return res.status(400).json({ error: "userId, questionId, userAnswer required" });

    const [user, question] = await Promise.all([User.findById(userId), Question.findById(questionId)]);
    if (!user || !question) return res.status(404).json({ error: "User or question not found" });

    // Build RAG context (short)
    const { context } = await retrieveContext({ domain: user.domain || question.domain }, question.prompt);

    // Construct analyst prompt (concise) including a rubric
    const prompt = `
You are a strict, helpful brain analyst. Evaluate the user's answer concisely, grade in 0-100 and give a short explanation.
Question: ${question.prompt}
User answer: ${userAnswer}
Context: ${context}

Return a friendly, step-by-step critique. Start with a one-line grade: "GRADE: <0-100>" then provide up to 160 words feedback. Then provide one targeted follow-up question. Stream content token-by-token.
    `.trim();

    setupSSE(res);
    // send a short ping first
    res.write(`event: token\ndata: ${JSON.stringify({ token: "Streaming AI feedback...\n" })}\n\n`);

    // stream from OpenAI
    await streamOpenAI(req, res, prompt);
  } catch (e) {
    console.error("streamAssist error", e);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    } catch (_) {}
  }
};
