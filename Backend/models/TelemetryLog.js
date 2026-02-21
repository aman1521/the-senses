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

module.exports = mongoose.model('TelemetryLog', TelemetryLogSchema);
