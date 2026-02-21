const mongoose = require('mongoose');

const TestSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true }, // UUID
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for guest/unclaimed
    status: {
        type: String,
        enum: ['started', 'video_intro', 'skill_test', 'psych_test', 'completed', 'invalidated'],
        default: 'started'
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },

    // Scores
    overallScore: { type: Number, default: 0 },
    skillScore: { type: Number, default: 0 },
    psychologyScore: { type: Number, default: 0 },
    integrityScore: { type: Number, default: 100 }, // Starts at 100

    // Metadata
    jobProfileId: { type: String },
    difficulty: { type: String },

    // Quick Flags (Aggregated from IntegrityEvents)
    cheatingFlags: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('TestSession', TestSessionSchema);
