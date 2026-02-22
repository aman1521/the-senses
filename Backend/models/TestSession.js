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

const TestSessionModel = mongoose.model('TestSession', TestSessionSchema);

const SimpleDB = require('../utils/SimpleDB');
const TestSessionMock = new SimpleDB('test_sessions');

module.exports = new Proxy(TestSessionModel, {
    get: function (target, prop) {
        if (global.USE_MOCK_DB) {
            if (prop === 'find') return (query) => TestSessionMock.find(query);
            if (prop === 'findOne') return (query) => TestSessionMock.findOne(query);
            if (prop === 'findById') return (id) => TestSessionMock.findById(id);
            if (prop === 'create') return (doc) => TestSessionMock.create(doc);
        }
        return target[prop];
    },
    construct: function (target, [doc]) {
        if (global.USE_MOCK_DB) {
            const instance = { ...doc };
            instance.save = async function () {
                const saved = await TestSessionMock.create(this);
                Object.assign(this, saved);
                return this;
            };
            return instance;
        }
        return new target(doc);
    }
});
