const { GoogleGenerativeAI } = require("@google/generative-ai");
const { processOnboardingChat } = require("../ai-agents/insights/onboardingAgent");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory chat history for prototype (in production, use Redis or DB)
const chatSessions = {};

/**
 * Handle user message in Onboarding Chat
 * POST /api/chat/onboarding
 */
exports.handleOnboardingMessage = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { message, isFinal } = req.body;

        if (!chatSessions[userId]) {
            chatSessions[userId] = [
                { role: "system", content: "You are a friendly, professional AI recruiter for 'The Senses'. Your goal is to interview the user to understand their specific job role, years of experience, and specific tools/skills they know. Be concise. Ask one question at a time." }
            ];
        }

        // Add user message
        chatSessions[userId].push({ role: "user", content: message });

        // If user says they are done or clicked "Finish", process the profile
        if (isFinal) {
            const transcript = chatSessions[userId].map(m => `${m.role}: ${m.content}`).join("\n");
            const profile = await processOnboardingChat(userId, transcript);

            // Clear session
            delete chatSessions[userId];

            return res.json({
                success: true,
                reply: "Thanks! I've built your profile. Redirecting you to your dashboard...",
                finished: true,
                profile
            });
        }

        // Generate AI Reply
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Filter history for Gemini (only user/model roles allowed)
        // EXCLUDE the last message because that is the 'current' message we are sending via sendMessage
        const geminiHistory = chatSessions[userId]
            .slice(0, -1) // Remove the last message (the one we just added)
            .filter(m => m.role !== "system")
            .map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

        const chat = model.startChat({
            history: geminiHistory
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();

        // Add AI reply to history
        chatSessions[userId].push({ role: "model", content: text });

        res.json({ success: true, reply: text, finished: false });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "AI Chat Failed" });
    }
};

/**
 * Reset Chat Session
 * POST /api/chat/reset
 */
exports.resetChat = (req, res) => {
    const userId = req.user._id.toString();
    delete chatSessions[userId];
    res.json({ success: true });
};
