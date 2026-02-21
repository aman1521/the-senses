// tools/generate-questions.cjs
// Node >= 16. No external deps.
// Output: questions_auto.json (>=1200 questions)

const fs = require("fs");
const path = require("path");

// ---------- Load books ----------
const ROOT = path.join(process.cwd());
const booksPath = path.join(ROOT, "data", "books.json");
const books = JSON.parse(fs.readFileSync(booksPath, "utf8"));

// ---------- Deterministic PRNG ----------
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x5EEDC0DE);

// ---------- Helpers ----------
function pick(arr) { return arr[Math.floor(rand() * arr.length)] }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)) }

// Types supported by your backend model
const TYPES = ["pattern","logic","problem","creativity","adapt"];

// Prompt templates per type (filled with book context)
const TEMPLATES = {
  pattern: [
    "({book}) You inherit a messy dataset tied to {theme}. What hidden pattern would you test first and why?",
    "({book}) Two signals conflict around {theme}. Propose a way to de-noise and detect the underlying pattern.",
    "({book}) Imagine a daily micro-behavior about {theme}. Model its compounding effect over 90 days—what curve do you expect and why?"
  ],
  logic: [
    "({book}) Your belief about {theme} is likely wrong. Construct a falsification test you’d run this week.",
    "({book}) Two experts disagree about {theme}. Design a 3-step logic check to decide who’s more likely right.",
    "({book}) You have 5 minutes to brief a skeptic on {theme}. What logical structure ensures maximum persuasion?"
  ],
  problem: [
    "({book}) A plan about {theme} failed hard. Diagnose 3 root causes and the smallest repair that could have saved it.",
    "({book}) You must deliver results on {theme} with half the resources. Outline a constraint-driven plan that still wins.",
    "({book}) You face a blocker in {theme}. Reframe it as a game: define rules, constraints, and a winnable path."
  ],
  creativity: [
    "({book}) You must 10X outcomes in {theme} without more budget. Pitch a weird, high-upside idea and the test you’d run first.",
    "({book}) Combine two normally unrelated fields with {theme}. Describe a useful, delightful mashup.",
    "({book}) Break a sacred rule in {theme} safely. Where is the hidden upside and how do you contain the risks?"
  ],
  adapt: [
    "({book}) Overnight, a key assumption in {theme} dies. Draft a 7-day pivot plan that preserves momentum.",
    "({book}) If your default approach to {theme} is banned for a month, how do you adapt and still hit the goal?",
    "({book}) A Black Swan disrupts {theme}. Define no-regret moves you’d execute in the next 24 hours."
  ]
};

// Domain → theme keywords (for richer prompts)
const DOMAIN_THEMES = {
  mindset: ["identity", "self-image", "learning", "effort"],
  creativity: ["novelty", "divergence", "experimentation"],
  resilience: ["grit", "recovery", "setbacks", "pressure"],
  philosophy: ["meaning", "ethics", "virtue", "acceptance"],
  emotions: ["affect", "regulation", "triggers", "empathy"],
  habits: ["loops", "cues", "rewards", "environment"],
  critical_thinking: ["evidence", "models", "assumptions", "error"],
  bias: ["heuristics", "framing", "anchoring", "overconfidence"],
  uncertainty: ["fat tails", "variance", "luck", "optionality"],
  decision: ["tradeoffs", "betting", "expected value", "priors"],
  productivity: ["focus", "bottlenecks", "systems", "priorities"],
  beliefs: ["narratives", "standards", "self-talk", "agency"],
  resistance: ["procrastination", "fear", "inner-critic", "shipping"],
  leadership: ["ownership", "mission", "coordination", "feedback"],
  healing: ["trauma", "integration", "safety", "resourcing"]
};

// For each book, produce N questions rotating types to cover skills
const QUESTIONS_PER_BOOK = 12; // 100 * 12 = 1200
const out = [];

for (const book of books) {
  const domain = book.domain in DOMAIN_THEMES ? book.domain : "mindset";
  const themes = DOMAIN_THEMES[domain];
  // create a rotating mix of question types with a bit of randomness
  const typeWheel = [...TYPES];
  for (let i = 0; i < QUESTIONS_PER_BOOK; i++) {
    const type = typeWheel[(i + Math.floor(rand()*3)) % typeWheel.length];
    const tmpl = pick(TEMPLATES[type]);
    const theme = pick(themes);
    const level = clamp(1 + Math.floor(rand() * 5), 1, 5);

    const prompt = tmpl
      .replace("{book}", `${book.title} — ${book.author}`)
      .replaceAll("{theme}", theme);

    out.push({
      // e.g., BK01-01, BK01-12, BK57-07 ...
      id: `BK${String(book.id).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`,
      domain,
      level,
      type,
      prompt
    });
  }
}

// Sanity: ensure we crossed 1200
if (out.length < 1200) {
  throw new Error("Not enough questions generated");
}

// Save
const outPath = path.join(ROOT, "questions_auto.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log(`✅ Generated ${out.length} questions -> ${outPath}`);
