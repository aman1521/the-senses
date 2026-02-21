const AIProfile = require("../models/AIProfile");

// GET /api/ai-battles/profiles - Get all AI profiles
exports.getAIProfiles = async (req, res) => {
    try {
        const profiles = await AIProfile.find().sort({ avgScore: -1 });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { generateBattleResponses } = require("../ai-agents/llm/battleAgent");

// POST /api/ai-battles/simulate - Interactive AI vs AI battle
exports.simulateAIBattle = async (req, res) => {
    try {
        const { ai1Id, ai2Id, prompt } = req.body;

        if (!ai1Id || !ai2Id) {
            return res.status(400).json({ error: "Two AI profiles required" });
        }

        const ai1 = await AIProfile.findById(ai1Id);
        const ai2 = await AIProfile.findById(ai2Id);

        if (!ai1 || !ai2) {
            return res.status(404).json({ error: "AI profile not found" });
        }

        // If a prompt is provided, generate text responses
        if (prompt) {
            const responses = await generateBattleResponses(ai1.name, ai2.name, prompt);
            return res.json({
                success: true,
                type: 'interactive',
                responses
            });
        }

        // Legacy auto-simulation logic (keeping for fallback)
        // ... (removed for brevity, replaced by simple error or fallback if needed)
        // Actually, let's just make prompt required for the new mode, 
        // or default to a random question if missing.

        const defaultPrompt = "Explain the concept of quantum entanglement to a 5-year old.";
        const responses = await generateBattleResponses(ai1.name, ai2.name, defaultPrompt);
        return res.json({
            success: true,
            type: 'interactive',
            responses,
            defaultPromptUsed: true
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/ai-battles/vote - User submits their verdict
exports.submitVote = async (req, res) => {
    try {
        const { ai1Id, ai2Id, winnerId, score1, score2 } = req.body;

        const ai1 = await AIProfile.findById(ai1Id);
        const ai2 = await AIProfile.findById(ai2Id);

        if (!ai1 || !ai2) return res.status(404).json({ error: "Profiles not found" });

        // Update stats
        ai1.totalBattles++;
        ai2.totalBattles++;

        if (winnerId === ai1Id) {
            ai1.battlesWon++;
            ai2.battlesLost++;
        } else if (winnerId === ai2Id) {
            ai2.battlesWon++;
            ai1.battlesLost++;
        } // else draw

        // Update avg scores (weighted moving average)
        if (score1) ai1.avgScore = Math.round((ai1.avgScore * 0.9) + (score1 * 0.1));
        if (score2) ai2.avgScore = Math.round((ai2.avgScore * 0.9) + (score2 * 0.1));

        await ai1.save();
        await ai2.save();

        res.json({ success: true, newStats: { ai1, ai2 } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/ai-battles/history - Get battle statistics
exports.getBattleHistory = async (req, res) => {
    try {
        const profiles = await AIProfile.find()
            .select('name emoji color totalBattles battlesWon battlesLost avgScore')
            .sort({ battlesWon: -1 });

        const leaderboard = profiles.map(ai => ({
            id: ai._id,
            name: ai.name,
            emoji: ai.emoji,
            color: ai.color,
            wins: ai.battlesWon,
            losses: ai.battlesLost,
            total: ai.totalBattles,
            winRate: ai.totalBattles > 0 ? ((ai.battlesWon / ai.totalBattles) * 100).toFixed(1) : 0,
            avgScore: ai.avgScore,
        }));

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
