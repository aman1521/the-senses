const mongoose = require('mongoose');

const DuelSchema = new mongoose.Schema({
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  jobProfile: String,
  difficulty: String,

  // Question set and answers
  questionSet: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  challengerAnswers: { type: Map, of: Number },
  opponentAnswers: { type: Map, of: Number },

  // Results
  challengerResult: {
    finalScore: Number,
    normalizedScore: Number,
    trustScore: Number,
  },
  opponentResult: {
    finalScore: Number,
    normalizedScore: Number,
    trustScore: Number,
  },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pending', 'active', 'accepted', 'completed', 'expired'],
    default: 'pending'
  },
}, { timestamps: true });

module.exports = mongoose.model('Duel', DuelSchema);
