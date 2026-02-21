const mongoose = require('mongoose');

const AIMetricsSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    operation: {
        type: String, // e.g., 'generate_questions', 'analyze_profile', 'anti_cheat_scan'
        required: true
    },
    model: {
        type: String, // e.g., 'gemini-pro', 'gpt-4'
        required: true
    },
    latencyMs: {
        type: Number,
        required: true
    },
    tokenCount: {
        prompt: Number,
        completion: Number,
        total: Number
    },
    success: {
        type: Boolean,
        required: true
    },
    error: {
        type: String
    },
    metadata: {
        profileId: String,
        difficulty: String,
        questionCount: Number,
        userId: String
    }
});

// Indexes for common queries
AIMetricsSchema.index({ operation: 1, timestamp: -1 });
AIMetricsSchema.index({ success: 1 });
AIMetricsSchema.index({ model: 1 });

module.exports = mongoose.model('AIMetrics', AIMetricsSchema);
