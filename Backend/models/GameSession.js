const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  finalScore: Number,
  accuracy: Number,
  avgTimePerQuestion: Number,

  startedAt: Date,
  expiresAt: Date,

  isSubmitted: { type: Boolean, default: false }
});

const SimpleDB = require('../utils/SimpleDB');
const GameSessionMock = new SimpleDB('game_sessions');
const GameSessionModel = mongoose.model('GameSession', gameSessionSchema);

module.exports = new Proxy(GameSessionModel, {
  get: function (target, prop) {
    if (global.USE_MOCK_DB) {
      if (prop === 'find') return (query) => GameSessionMock.find(query);
      if (prop === 'findOne') return (query) => GameSessionMock.findOne(query);
      if (prop === 'create') return (doc) => GameSessionMock.create(doc);
    }
    return target[prop];
  },
  construct: function (target, [doc]) {
    if (global.USE_MOCK_DB) {
      const instance = { ...doc };
      instance.save = async function () {
        const saved = await GameSessionMock.create(this);
        Object.assign(this, saved);
        return this;
      };
      return instance;
    }
    return new target(doc);
  }
});
