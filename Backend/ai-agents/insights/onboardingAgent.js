const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../../models/User");

// Initialize Gemini (Ensure API Key is in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * processOnboardingChat
 * 
 * Takes the raw chat transcript from the onboarding interview.
 * Extracts:
 * 1. Bio (Professional Summary)
 * 2. Top Skills (List)
 * 3. Skill Weights (0.0 - 1.0 confidence based on user's answers)
 * 
 * @param {string} userId - User ID to update
 * @param {string} chatTranscript - The full conversation text
 * @returns {Promise<Object>} - The extracted profile data
 */
async function processOnboardingChat(userId, chatTranscript) {
    try {
        console.log(`🧠 AI Agent: Analying onboarding chat for user ${userId}...`);

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            You are an expert HR profiler. Analyze the following chat transcript between an AI interviewer and a candidate.
            
            TRANSCRIPT:
            ${chatTranscript}
            
            TASK:
            Extract a structured professional profile.
            1. Create a short, punchy 1-sentence Bio (e.g., "Senior React Developer with 5 years experience in Fintech.").
            2. Identify the Top 5-10 Hard Skills mentioned.
            3. Assign a "Confidence Score" (0.1 to 1.0) for each skill based on how deep their answers were. 
               - Mentioned briefly = 0.3
               - Explained well = 0.7
               - Demonstrated expert knowledge = 1.0
            
            OUTPUT JSON ONLY:
            {
                "bio": "...",
                "skills": ["React", "Node.js", ...],
                "skillsMetadata": {
                    "React": 0.9,
                    "Node.js": 0.6
                }
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        const profileData = JSON.parse(text);

        // Update User in DB
        await User.findByIdAndUpdate(userId, {
            bio: profileData.bio,
            skills: profileData.skills,
            skillsMetadata: profileData.skillsMetadata,
            onboardingCompleted: true
        });

        console.log("✅ User Profile Updated via AI Analysis");
        return profileData;

    } catch (error) {
        console.error("❌ Onboarding Analysis Failed:", error);
        throw error;
    }
}

module.exports = { processOnboardingChat };
