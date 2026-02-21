const { GoogleGenerativeAI } = require("@google/generative-ai");
const Company = require("../../models/Company");
const CompanyReputation = require("../../models/CompanyReputation");
const User = require("../../models/User");

// Initialize Gemini (or use OpenAI if preferred, staying consistent with project)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy_key");

/**
 * ORCHESTRATOR: Judges company signals to build reputation.
 * 
 * 1. Legitimacy Agent
 * 2. Thinking Bar Agent
 * 3. Decision Quality Agent
 * 4. Talent Outcome Agent (Data-driven)
 * 5. Consistency Agent
 */
async function evaluateCompanyReputation(companyId) {
    try {
        const company = await Company.findById(companyId);
        if (!company) throw new Error("Company not found");

        // 1. Gather Data (Inputs + Outcomes)
        const employees = await User.find({ _id: { $in: company.employees || [] } });
        const employeesVerified = employees.filter(e => e.stats && e.stats.bestScore > 0);

        const outcomes = calculateTalentOutcomes(employeesVerified);

        // 2. Prepare Context for AI Agents
        const context = {
            input: {
                identity: { name: company.name, industry: company.industry, size: company.size },
                claims: company.hiringSignals,
                culture: company.decisionCulture,
                demand: company.thinkingDemand
            },
            reality: {
                employeeCount: employees.length,
                verifiedCount: employeesVerified.length,
                avgScore: outcomes.avgSenseIndex,
                topTierCount: outcomes.topTierCount
            }
        };

        // 3. Run AI Agents (Simulated sequential calls for stability)
        const agentResults = await runAgents(context);

        // 4. Calculate Final Reputation Score
        // Formula: 0.30*Thinking + 0.25*Talent + 0.20*Decision + 0.15*Consistency + 0.10*Legitimacy
        const finalScore = Math.round(
            (0.30 * (agentResults.thinkingBar * 10)) +
            (0.25 * agentResults.talentOutcome) +
            (0.20 * agentResults.decisionQuality) +
            (0.15 * agentResults.consistency) +
            (0.10 * agentResults.legitimacy)
        );

        // 5. Update/Upsert Reputation
        const rep = await CompanyReputation.findOneAndUpdate(
            { companyId: company._id },
            {
                scores: {
                    reputation: finalScore,
                    legitimacy: agentResults.legitimacy,
                    thinkingBar: agentResults.thinkingBar, // 1-10
                    decisionQuality: agentResults.decisionQuality,
                    talentOutcome: agentResults.talentOutcome,
                    consistency: agentResults.consistency
                },
                signature: agentResults.signature,
                outcomes: {
                    avgSenseIndexHired: outcomes.avgSenseIndex,
                    retentionSignal: 'Stable', // Placeholder logic
                    topPercentileHired: outcomes.topPercentile
                },
                agentLogs: agentResults.logs,
                lastEvaluatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        return rep;

    } catch (error) {
        console.error("Reputation Evaluation Failed:", error);
        throw error;
    }
}

// --- Hard Data Calculation ---
function calculateTalentOutcomes(employees) {
    if (!employees.length) return { avgSenseIndex: 0, topTierCount: 0, topPercentile: 0 };

    const scores = employees.map(e => e.stats?.bestScore || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Top Tier (e.g., > 80 score)
    const topTier = employees.filter(e => (e.stats?.bestScore || 0) >= 80).length;

    // Convert avg score (0-100) to Outcome Score (0-100)
    // If avg is 80, outcome score is high.
    // If avg is 40, outcome score is low.

    return {
        avgSenseIndex: Math.round(avg),
        topTierCount: topTier,
        topPercentile: Math.round((topTier / employees.length) * 100)
    };
}

// --- AI Agent Logic ---
async function runAgents(context) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    SYSTEM: You are the Company Reputation Engine Orchestrator.
    Evaluate this company based on conflict between CLAIMS and REALITY.
    
    INPUTS (Claims):
    ${JSON.stringify(context.input, null, 2)}

    REALITY (Outcomes):
    ${JSON.stringify(context.reality, null, 2)}

    MANDATE:
    1. LEGITIMACY: Is the company real? Do claims match size/industry norms?
    2. THINKING BAR: Does the company require high cognitive checking? (1-10 scale). 
       - If claims are high but avgScore is low, PENALIZE.
       - If claims are modest but avgScore is high, REWARD.
    3. DECISION QUALITY: Infer from culture tags. (0-100).
    4. TALENT OUTCOME: Score 0-100 based on verified avgScore.
    5. CONSISTENCY: Is the profile coherent?

    OUTPUT JSON:
    {
        "legitimacy": number (0-100),
        "thinkingBar": number (1-10),
        "decisionQuality": number (0-100),
        "talentOutcome": number (0-100),
        "consistency": number (0-100),
        "signature": {
            "dominantDimensions": ["string"],
            "problemTypes": ["string"],
            "archetype": "string"
        },
        "reasoning": "string summary"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);

    } catch (error) {
        console.error("AI Agent Error", error);
        // Fallback safety
        return {
            legitimacy: 50,
            thinkingBar: 5,
            decisionQuality: 50,
            talentOutcome: Math.min(context.reality.avgScore, 100),
            consistency: 50,
            signature: { dominantDimensions: ["Unknown"], problemTypes: ["General"], archetype: "Unverified" },
            logs: ["AI Generation Failed - Using Fallback"]
        };
    }
}

module.exports = { evaluateCompanyReputation };
