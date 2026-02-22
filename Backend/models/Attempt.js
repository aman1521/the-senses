const mongoose = require("mongoose");

/**
 * Attempt Schema
 * Records a single question-level interaction during a test session.
 * This is the granular "exam paper" record that powers the scoring engine
 * and enables per-dimension leaderboard rankings.
 */
const AttemptSchema = new mongoose.Schema({
  // Core Relationships
  user: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    index: true,
    required: true // Links attempt to an IntelligenceResult session
  },

  // Answer Data
  answerText: {
    type: String,
    default: null
  },
  answerIndex: {
    type: Number,
    default: null // For MCQ answers
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  timeSpentMs: {
    type: Number,
    default: 0 // Time spent on this specific question in ms
  },

  // Scoring & AI Grading
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  rubric: {
    // Dimension-level breakdown for leaderboard (e.g. { logic: 80, creativity: 70 })
    bins: {
      logic: { type: Number, default: 0 },
      creativity: { type: Number, default: 0 },
      empathy: { type: Number, default: 0 },
      systemsThinking: { type: Number, default: 0 },
      communication: { type: Number, default: 0 }
    },
    reasoning: String,   // AI explanation of the grade
    maxScore: { type: Number, default: 100 }
  },

  // AI Grading Metadata
  feedback: String,         // Short feedback to show user
  followUp: String,         // Suggested follow-up question from AI
  aiGraded: {
    type: Boolean,
    default: false
  },

  // Anti-cheat signals captured during this question
  integritySignals: {
    tabSwitches: { type: Number, default: 0 },
    pasteEvents: { type: Number, default: 0 },
    suspiciouslyFast: { type: Boolean, default: false }
  },

  // Snapshot of user profile at time of attempt (for historical analysis)
  profileSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true });

// Compound index for leaderboard dimension aggregation queries
AttemptSchema.index({ user: 1, sessionId: 1 });
AttemptSchema.index({ "rubric.bins.logic": -1 });
AttemptSchema.index({ "rubric.bins.creativity": -1 });

const AttemptModel = mongoose.model("Attempt", AttemptSchema);

const SimpleDB = require('../utils/SimpleDB');
const AttemptMock = new SimpleDB('attempts');

module.exports = new Proxy(AttemptModel, {
  get: function (target, prop) {
    if (global.USE_MOCK_DB) {
      if (prop === 'find') return (query) => AttemptMock.find(query);
      if (prop === 'findOne') return (query) => AttemptMock.findOne(query);
      if (prop === 'findById') return (id) => AttemptMock.findById(id);
      if (prop === 'create') return (doc) => AttemptMock.create(doc);
      if (prop === 'insertMany') return async (docs) => {
        for (let doc of docs) await AttemptMock.create(doc);
        return docs;
      };
    }
    return target[prop];
  },
  construct: function (target, [doc]) {
    if (global.USE_MOCK_DB) {
      const instance = { ...doc };
      instance.save = async function () {
        const saved = await AttemptMock.create(this);
        Object.assign(this, saved);
        return this;
      };
      return instance;
    }
    return new target(doc);
  }
});
