const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const PERSONAS = {
    "Omni-G 4.0": "You are Omni-G 4.0 (simulating GPT-4o). You are helpful, extremely knowledgeable, and balanced. You use structured formatting.",
    "Anthropic 3.5 Sonnet": "You are simulating Claude 3.5 Sonnet. You are concise, highly intelligent, and focus on safety and directness. You avoid fluff.",
    "Gemini 1.5 Pro": "You are Gemini 1.5 Pro. You are creative, thoughtful, and good at connecting disparate concepts. You use a friendly tone.",
    "Meta Llama 3": "You are simulating Llama 3. You are fast, efficient, and open. You get straight to the point.",
    "Mistral Large": "You are simulating Mistral Large. You are precise and European-centric in your logical rigor.",
    "Grok 1.5": "You are simulating Grok. You have a rebellious streak, you use humor, you are witty and sometimes sarcastic."
};

async function callOpenAI(persona, prompt) {
    if (!openai) throw new Error("OpenAI API key not configured");
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: persona },
            { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
    });
    return response.choices[0].message.content;
}

async function callGemini(persona, prompt) {
    if (!genAI) throw new Error("Gemini API not configured");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${persona}\n\nUser: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}

exports.generateBattleResponses = async (ai1Name, ai2Name, userPrompt) => {
    try {
        const p1 = PERSONAS[ai1Name] || `You are ${ai1Name}, a helpful AI assistant.`;
        const p2 = PERSONAS[ai2Name] || `You are ${ai2Name}, a helpful AI assistant.`;

        // Use Gemini for "Gemini 1.5 Pro", OpenAI for others
        const useGemini1 = ai1Name === "Gemini 1.5 Pro" && genAI;
        const useGemini2 = ai2Name === "Gemini 1.5 Pro" && genAI;

        const [res1, res2] = await Promise.all([
            useGemini1 ? callGemini(p1, userPrompt) : callOpenAI(p1, userPrompt),
            useGemini2 ? callGemini(p2, userPrompt) : callOpenAI(p2, userPrompt)
        ]);

        return {
            ai1Response: res1,
            ai2Response: res2
        };
    } catch (error) {
        console.error("LLM Battle Error:", error.message);
        // Fallback for demo if API fails
        return {
            ai1Response: `I would approach "${userPrompt}" by first breaking down the core concepts into digestible parts, then building up a comprehensive understanding through logical progression.`,
            ai2Response: `My perspective on "${userPrompt}" focuses on the creative and interconnected aspects, drawing parallels to help build intuitive understanding.`
        };
    }
};
