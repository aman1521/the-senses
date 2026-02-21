const mongoose = require("mongoose");

const IntelligenceResultSchema = new mongoose.Schema(
  {
    // Session tracking
    sessionId: {
      type: String,
      index: true,
      sparse: true,
    },
    userId: {
      type: String,
      index: true,
      required: true,
    },
    country: {
      type: String,
      default: "global",
    },

    // Share metadata with slug
    share: {
      slug: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        lowercase: true,
        trim: true,
      },
      headline: String,
    },

    // User intelligence profile
    profile: {
      thinkingStyle: String,
      strengths: [String],
      cognitiveBiases: [String],
      summary: String,
    },

    // Ranking tier
    rank: {
      tier: String,
      globalPercentile: Number,
      globalRank: Number,
      countryRank: Number,
      field: String,
    },

    // Evaluation metrics
    finalScore: Number,
    normalizedScore: Number,
    difficulty: String,
    trustScore: Number,
    badge: String,

    // Phase 5: Behavioral Intelligence
    behaviorAnalysis: {
      rawTelemetryCount: Number,
      focusLossRate: Number,
      latencyVariance: Number,
      integrityMultiplier: { type: Number, default: 1.0 },
      confidenceLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
      signals: [String] // List of derived signals/messages
    },

    // Phase 5: Reflex & Attention Metrics
    reflexMetrics: {
      reactionTimeMs: Number,
      accuracyScore: Number,      // 0.0 - 1.0
      strokeConsistency: Number,  // 0.0 - 1.0
      correctionCount: Number,

      // Computed Scores
      attentionScore: Number,     // 0.0 - 1.0
      motorControlScore: Number,  // 0.0 - 1.0
      reflexScore: Number,        // 0.0 - 1.0
      fatigueIndicator: Boolean
    },

    // Detailed Test History (The 'Exam Paper')
    testDetail: {
      questions: [{
        questionId: String,
        questionText: String,
        topic: String,
        userAnswer: mongoose.Schema.Types.Mixed, // text or index
        correctAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        timeSpent: Number
      }],
      totalQuestions: Number,
      correctCount: Number,
      completionTime: Number
    },

    meta: mongoose.Schema.Types.Mixed,

    // Metadata
    testHash: String,
    isFinalized: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for fast OG lookups
IntelligenceResultSchema.index({ "share.slug": 1, createdAt: -1 });

const SimpleDB = require('../utils/SimpleDB');
const ResultMock = new SimpleDB('intelligence_results');
const ResultModel = mongoose.model(
  "IntelligenceResult",
  IntelligenceResultSchema
);

module.exports = new Proxy(ResultModel, {
  get: function (target, prop) {
    if (global.USE_MOCK_DB) {
      if (prop === 'find') return (query) => ResultMock.find(query);
      if (prop === 'findOne') return (query) => ResultMock.findOne(query);
      if (prop === 'findById') return (id) => ResultMock.findById(id);
      if (prop === 'create') return (doc) => ResultMock.create(doc);
    }
    return target[prop];
  },
  construct: function (target, [doc]) {
    if (global.USE_MOCK_DB) {
      const instance = { ...doc };
      instance.save = async function () {
        const saved = await ResultMock.create(this);
        Object.assign(this, saved);
        return this;
      };
      return instance;
    }
    return new target(doc);
  }
});

