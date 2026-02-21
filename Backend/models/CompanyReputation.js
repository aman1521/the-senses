const mongoose = require("mongoose");

const CompanyReputationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true,
        unique: true
    },

    // 1. Calculated Scores (0-100 or 1-10)
    scores: {
        reputation: { type: Number, default: 0 }, // The weighted final score
        legitimacy: { type: Number, default: 0 },
        thinkingBar: { type: Number, default: 0 }, // 1-10
        decisionQuality: { type: Number, default: 0 },
        talentOutcome: { type: Number, default: 0 },
        consistency: { type: Number, default: 0 }
    },

    // 2. Thinking Signature (Qualitative)
    signature: {
        dominantDimensions: [String], // e.g., ["Systems Thinking", "First Principles"]
        problemTypes: [String],       // e.g., "Ambiguous", "Linear", "Creative"
        archetype: String             // e.g., "High-Velocity Experimental"
    },

    // 3. Hard Outcomes (Data-driven)
    outcomes: {
        avgSenseIndexHired: { type: Number, default: 0 },
        retentionSignal: { type: String, enum: ['High', 'Stable', 'Low'], default: 'Stable' },
        topPercentileHired: { type: Number, default: 0 } // % of hires in top 10%
    },

    // 4. Analysis Metadata
    lastEvaluatedAt: { type: Date, default: Date.now },
    agentLogs: [String] // Summary of key agent decisions for auditing
}, { timestamps: true });

module.exports = mongoose.model("CompanyReputation", CompanyReputationSchema);
