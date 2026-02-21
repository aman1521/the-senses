const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  id: String,
  domain: String,
  level: Number,
  type: {
    type: String,
    enum: ["pattern", "logic", "problem", "creativity", "adapt", "case_study", "failure_analysis", "cross_industry", "audio"]
  },
  prompt: String,
  context: String, // Case study text
  media: { type: String, url: String },
  choices: [{ text: String, score: Number, next: String }]
}, { timestamps: true });

module.exports = mongoose.model("Question", QuestionSchema);
