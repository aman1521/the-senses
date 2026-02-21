const TelemetryLog = require('../models/TelemetryLog');
const { processTelemetryBatch } = require('../Services/behavioralAnalysisService');

// @desc    Log client-side telemetry events
// @route   POST /api/v1/session/telemetry
// @access  Private
exports.logTelemetry = async (req, res) => {
    try {
        const { sessionId, events, metadata } = req.body;
        const userId = req.user._id;

        // Basic validation
        if (!sessionId || !events || !Array.isArray(events)) {
            return res.status(400).json({
                success: false,
                message: "Invalid telemetry payload: 'sessionId' and 'events' array required."
            });
        }

        // 1. Store Raw Telemetry
        const logEntry = await TelemetryLog.create({
            sessionId,
            userId,
            batchId: metadata?.batchId,
            events: events.map(e => ({
                eventType: e.event_type || e.eventType, // Handle both snake_case (client) and camelCase
                timestamp: e.timestamp || new Date(),
                questionId: e.question_id || e.questionId,
                metadata: e.metadata
            })),
            processed: false
        });

        // 2. Process Behavior Signals (Async)
        // Don't await this to keep response fast
        processTelemetryBatch(sessionId, userId, logEntry.events)
            .catch(err => console.error(`[Telemetry] Processing error for session ${sessionId}:`, err));

        res.status(200).json({
            success: true,
            received: events.length,
            batchId: logEntry._id
        });

    } catch (error) {
        console.error("[Telemetry] Controller Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
