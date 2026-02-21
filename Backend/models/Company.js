const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema({
  // Identity
  name: { type: String, required: true },
  website: String,
  industry: String,
  size: String,
  foundedYear: Number,
  regions: [String],

  // Thinking Demand (Input)
  thinkingDemand: {
    roles: [String],
    experienceLevels: [String], // intern, junior, mid, senior
    problemDomains: [String]    // systems, design, etc.
  },

  // Decision Culture (Input)
  decisionCulture: {
    style: String,            // data-driven, intuition-led, etc.
    pace: String,             // deliberate, fast
    ambiguityTolerance: String // low, high
  },

  // Hiring Signals (Self-Declared)
  hiringSignals: {
    evaluationRigor: String,  // low, medium, high
    claimedDifficulty: Number, // 1-10
    hiresLastYear: Number
  },

  // System
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Owner of the profile
}, { timestamps: true });

module.exports = mongoose.model("Company", CompanySchema);
