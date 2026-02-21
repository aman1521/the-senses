const mongoose = require('mongoose');

const AIProfileSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    modelType: { type: String, required: true }, // e.g., "GPT-4", "Claude 3.5", "Gemini Pro"

    // AI capabilities (0-100 scores)
    capabilities: {
        logical: { type: Number, default: 80 },
        creative: { type: Number, default: 75 },
        analytical: { type: Number, default: 85 },
        memory: { type: Number, default: 70 },
        speed: { type: Number, default: 90 },
    },

    // Performance metrics
    avgScore: { type: Number, default: 75 },
    battlesWon: { type: Number, default: 0 },
    battlesLost: { type: Number, default: 0 },
    totalBattles: { type: Number, default: 0 },

    // Trust score (always 100 for AI benchmarks)
    trustScore: { type: Number, default: 100 },

    // Visual customization
    color: { type: String, default: '#3b82f6' },
    emoji: { type: String, default: '🤖' },

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AIProfile', AIProfileSchema);
