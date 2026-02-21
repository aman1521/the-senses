const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
// Ensure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI-Powered Career Path Suggester
 * Uses Gemini to analyze strengths/weaknesses and suggest specific roles.
 * Falls back to rule-based logic if AI fails.
 * 
 * @param {Object} params
 * @param {string} params.jobProfile - e.g., "developer", "designer"
 * @param {string[]} params.strengths - List of user strengths
 * @param {string[]} params.weaknesses - List of user weaknesses/biases
 * @returns {Promise<string>} - Suggested career path (e.g., "Senior Backend Engineer")
 */
async function suggestCareerPath({ jobProfile, strengths, weaknesses = [] }) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY missing, using fallback career logic.");
      return getFallbackCareer({ jobProfile, strengths });
    }

    const prompt = `
      You are a career coaching expert. Analyze this professional profile and suggest the SINGLE most suitable specific career path or job role.
      
      Job Profile: ${jobProfile}
      Strengths: ${strengths.join(", ")}
      Weaknesses: ${weaknesses.join(", ")}
      
      Output ONLY the Job Title/Role Name. No explanation, no punctuation.
      Examples: "Frontend Architect", "AI Research Scientist", "Product Designer".
    `;

    let text;
    try {
      // 1. Try Gemini Pro (Stable)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } catch (modelError) {
      console.warn("⚠️ Gemini 1.5 Flash failed, retrying with Gemini Pro...", modelError.message);

      // 2. Fallback to Gemini Pro (Stable)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    }

    // Clean up response if it contains extra text
    const cleanRole = text.trim().split("\n")[0].replace(/['"]/g, "").trim();

    console.log(`🤖 AI Suggested Career: ${cleanRole}`);
    return cleanRole;

  } catch (error) {
    console.error("❌ AI Career Suggestion failed:", error.message);
    return getFallbackCareer({ jobProfile, strengths });
  }
}

/**
 * Fallback Rule-Based Logic (Original Implementation)
 */
function getFallbackCareer({ jobProfile, strengths }) {
  if (jobProfile === "developer") {
    if (strengths && strengths.includes("Logic"))
      return "Backend / Systems Engineering";
    if (strengths && strengths.includes("Creativity"))
      return "Frontend / UI Engineering";
  }

  if (jobProfile === "designer") {
    return "Product Design / UX Strategy";
  }

  return "General Problem-Solving Roles";
}

module.exports = { suggestCareerPath };
