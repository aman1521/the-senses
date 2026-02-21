// controllers/companyCoachController.js
const User = require("../models/User");
const Attempt = require("../models/Attempt");
const { client } = require("../config/Ai"); // if using SDK
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const fetch = require("node-fetch");

async function synthesize(text) {
  // quick call to OpenAI for summarization (non-streaming)
  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model: process.env.AI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a concise company coach. Summarize key blind spots and actionable recommendations in bullet points." },
      { role: "user", content: text }
    ],
    temperature: 0.3
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await r.json();
  return data.choices?.[0]?.message?.content || "";
}

// GET /api/company/coach/:companyId
exports.companyCoach = async (req, res) => {
  try {
    const { companyId } = req.params;
    const users = await User.find({ company: companyId });
    const userIds = users.map(u => u._id);
    const attempts = await Attempt.find({ user: { $in: userIds } }).sort({ createdAt: -1 }).limit(500);

    // Derive short dataset: per-user average score per dimension (from attempt.rubric.bins)
    const perUser = {};
    for (const a of attempts) {
      const uid = String(a.user);
      perUser[uid] = perUser[uid] || { cnt: 0, sum: 0, bins: {} };
      perUser[uid].cnt++;
      perUser[uid].sum += (a.score || 0);
      const bs = (a.rubric && a.rubric.bins) || {};
      for (const k of Object.keys(bs)) perUser[uid].bins[k] = (perUser[uid].bins[k] || 0) + (bs[k] || 0);
    }

    const summaryLines = [];
    summaryLines.push(`Company: ${companyId}`);
    for (const u of users) {
      const uid = String(u._id);
      const p = perUser[uid];
      if (!p) { summaryLines.push(`${u.name}: No attempts`); continue; }
      const avg = Math.round(p.sum / p.cnt);
      summaryLines.push(`${u.name}: avgScore=${avg}, attempts=${p.cnt}`);
      const dims = Object.entries(p.bins).sort((a,b) => b[1]-a[1]).slice(0,3).map(x => `${x[0]}:${Math.round(x[1]/p.cnt)}`);
      summaryLines.push(`  strengths/weaknesses: ${dims.join(", ")}`);
    }

    const raw = summaryLines.join("\n");
    const coachText = await synthesize(raw);
    res.json({ coach: coachText, raw: summaryLines });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
