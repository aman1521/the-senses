// controllers/planController.js
const fetch = require("node-fetch");
const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(prompt) {
  const url = "https://api.openai.com/v1/chat/completions";
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: "You create practical weekly drills for thinking skills." }, { role: "user", content: prompt }],
      temperature: 0.6
    })
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

// POST /api/ai/plan
exports.generatePlan = async (req, res) => {
  try {
    const { userId, domain = "general", goal = "improve reasoning", weeks = 4 } = req.body;
    const prompt = `Create a ${weeks}-week practical plan for ${goal} for domain ${domain}. Each week: 3 drills, a daily 10-min exercise, one reflection prompt. Output JSON: {weeks:[{week:1,drills:[],daily:"",reflection:""}]}`;
    const out = await callOpenAI(prompt);
    // try parse JSON, otherwise send raw text
    try { return res.json({ plan: JSON.parse(out) }); } catch { return res.json({ planText: out }); }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
