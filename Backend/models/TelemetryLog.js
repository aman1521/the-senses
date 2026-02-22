const mongoose = require('mongoose');

const TelemetryLogSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    batchId: { type: String }, // Client-generated batch ID
    events: [{
        eventType: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        questionId: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed }
    }],
    processed: { type: Boolean, default: false }, // Has this batch been analyzed for signals?
    createdAt: { type: Date, default: Date.now, expires: 604800 } // TTL: Auto-delete after 7 days (604800s)
});

const TelemetryLogModel = mongoose.model('TelemetryLog', TelemetryLogSchema);

const SimpleDB = require('../utils/SimpleDB');
const TelemetryLogMock = new SimpleDB('telemetrylogs');

module.exports = new Proxy(TelemetryLogModel, {
    get: function (target, prop) {
        if (global.USE_MOCK_DB) {
            if (prop === 'find') return (query) => TelemetryLogMock.find(query);
            if (prop === 'findOne') return (query) => TelemetryLogMock.findOne(query);
            if (prop === 'findById') return (id) => TelemetryLogMock.findById(id);
            if (prop === 'create') return (doc) => TelemetryLogMock.create(doc);
            if (prop === 'insertMany') return async (docs) => {
                for (let doc of docs) await TelemetryLogMock.create(doc);
                return docs;
            };
        }
        return target[prop];
    },
    construct: function (target, [doc]) {
        if (global.USE_MOCK_DB) {
            const instance = { ...doc };
            instance.save = async function () {
                const saved = await TelemetryLogMock.create(this);
                Object.assign(this, saved);
                return this;
            };
            return instance;
        }
        return new target(doc);
    }
});
