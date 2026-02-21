// config/ai.js
const OpenAI = require("openai");

let client = null;

// Only initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  console.warn("⚠️  OpenAI API key not found. AI-powered features will be disabled.");
}

module.exports = {
  client,
  MODEL: process.env.AI_MODEL || "gpt-4o-mini",
  EMBED_MODEL: process.env.EMBED_MODEL || "text-embedding-3-large"
};
