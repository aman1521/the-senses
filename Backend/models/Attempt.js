const mongoose = require("mongoose");

const AttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  answerText: String,
  score: Number,
  rubric: Object,
  feedback: String,
  followUp: String,
  profileSnapshot: Object
}, { timestamps: true });

module.exports = mongoose.model("Attempt", AttemptSchema);
