const TelemetryLog = require('../models/TelemetryLog');
const IntegrityEvent = require('../models/IntegrityEvent');

/**
 * Process a batch of telemetry events to derive behavioral signals
 * @param {String} sessionId 
 * @param {String} userId 
 * @param {Array} events 
 */
async function processTelemetryBatch(sessionId, userId, events) {
    if (!events || events.length === 0) return;

    // 1. Analyze Focus Loss (Window Blur / Tab Switch / Visibility Change)
    const focusLossEvents = events.filter(e =>
        ['window_blur', 'tab_switch', 'visibility_change', 'app_backgrounded'].includes(e.eventType)
    );

    if (focusLossEvents.length > 0) {
        // Calculate total focus loss duration if possible (requires start/end logic, but let's count events for now)
        const switchCount = focusLossEvents.length;

        // Log a summary signal if significant focus loss in this batch
        if (switchCount > 2) {
            await IntegrityEvent.create({
                sessionId,
                userId,
                stage: 'skill', // Assuming skill test for now, could be dynamic
                eventType: 'telemetry_batch', // Or specific type
                severity: switchCount > 5 ? 'medium' : 'low',
                details: JSON.stringify({
                    message: `Significant focus loss detected in batch`,
                    count: switchCount,
                    types: focusLossEvents.map(e => e.eventType),
                    metadata: { focus_loss_rate: switchCount / 10 } // Rough rate per batch interval
                })
            });
        }
    }

    // 2. Analyze Copy/Paste Frequency
    const pasteEvents = events.filter(e => e.eventType === 'paste_event');
    if (pasteEvents.length > 0) {
        await IntegrityEvent.create({
            sessionId,
            userId,
            stage: 'skill',
            eventType: 'MULTIPLE_COPY_PASTE',
            severity: pasteEvents.length > 1 ? 'medium' : 'low',
            details: JSON.stringify({
                message: `Paste events detected`,
                count: pasteEvents.length
            })
        });
    }

    // 3. Latency Analysis (if answer_submit exists)
    const answers = events.filter(e => e.eventType === 'answer_submit');
    answers.forEach(async (ans) => {
        const latency = ans.metadata?.response_time_ms;
        if (latency && latency < 2000) { // < 2 seconds
            await IntegrityEvent.create({
                sessionId,
                userId,
                stage: 'skill',
                eventType: 'TIME_SUSPICIOUSLY_FAST',
                severity: latency < 1000 ? 'high' : 'medium',
                details: JSON.stringify({
                    message: `Fast answer submission: ${latency}ms`,
                    questionId: ans.questionId
                })
            });
        }
    });

    // 4. Update Rolling Session Metrics (Optional - stored in GameSession or TestSession usually)
    // For now, we rely on IntegrityEvent aggregation.
}

/**
 * Calculate final behavioral report for a session
 * (Called at end of test)
 */
/**
 * Calculate final behavioral report for a session
 * (Called at end of test)
 */
async function generateBehavioralReport(sessionId) {
    // Aggregate all TelemetryLogs for session
    const logs = await TelemetryLog.find({ sessionId });
    const allEvents = logs.flatMap(l => l.events);

    const totalDurationMs = calculateSessionDuration(allEvents);
    const focusLossEvents = allEvents.filter(e => ['window_blur', 'tab_switch', 'visibility_change', 'app_backgrounded'].includes(e.eventType));
    const pasteEvents = allEvents.filter(e => e.eventType === 'paste_event');
    const answerEvents = allEvents.filter(e => e.eventType === 'answer_submit');

    // 1. Derived Metrics
    // Focus Loss per minute
    const focusLossRate = focusLossEvents.length / (totalDurationMs / 60000 || 1);

    // Latency Analysis
    const { avgLatency, latencyVariance } = calculateLatencyMetrics(answerEvents);

    // Paste Frequency
    const pasteFrequency = pasteEvents.length;

    // Idle Anomalies (long periods of inactivity)
    const idleEvents = allEvents.filter(e => e.eventType === 'idle_start');
    const idleAnomalies = idleEvents.length > 2; // Arbitrary threshold

    // 2. Risk Calculation
    // Weighted risk score (0.0 to 1.0)
    let riskScore = 0;

    // Focus Loss Risk (0.0 - 0.4)
    if (focusLossRate > 4) riskScore += 0.4;
    else if (focusLossRate > 1) riskScore += 0.2;

    // Paste Risk (0.0 - 0.3)
    if (pasteFrequency > 2) riskScore += 0.3;
    else if (pasteFrequency > 0) riskScore += 0.1;

    // Latency Consistency Risk (0.0 - 0.2)
    // Very low variance might indicate a script, very high might indicate looking up answers
    if (answerEvents.length > 5 && latencyVariance < 100) riskScore += 0.2; // Robotically consistent

    // Idle Risk (0.0 - 0.1)
    if (idleAnomalies) riskScore += 0.1;

    // Cap risk at 1.0
    const cheatRisk = Math.min(1.0, parseFloat(riskScore.toFixed(2)));

    // 3. Integrity Multiplier (0.5 - 1.0)
    // Risk 1.0 -> Multiplier 0.5
    // Risk 0.0 -> Multiplier 1.0
    const integrityMultiplier = parseFloat((1.0 - (cheatRisk * 0.5)).toFixed(2));

    // 4. Confidence Level
    let confidenceLevel = 'high';
    if (cheatRisk > 0.6) confidenceLevel = 'low';
    else if (cheatRisk > 0.3) confidenceLevel = 'medium';

    return {
        focus_loss_rate: parseFloat(focusLossRate.toFixed(2)),
        avg_response_latency: parseFloat(avgLatency.toFixed(2)),
        latency_variance: parseFloat(latencyVariance.toFixed(2)),
        paste_frequency: pasteFrequency,
        idle_anomalies: idleAnomalies,

        cheat_risk: cheatRisk,
        integrity_multiplier: integrityMultiplier,
        confidence_level: confidenceLevel
    };
}

function calculateLatencyMetrics(answerEvents) {
    if (!answerEvents || answerEvents.length < 2) return { avgLatency: 0, latencyVariance: 0 };

    // Extract latencies (assuming metadata.response_time_ms is populated)
    const latencies = answerEvents.map(e => e.metadata?.response_time_ms || 0).filter(t => t > 0);

    if (latencies.length === 0) return { avgLatency: 0, latencyVariance: 0 };

    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = sum / latencies.length;

    const variance = latencies.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / latencies.length;

    return { avgLatency: avg, latencyVariance: Math.sqrt(variance) }; // Actually returning StdDev as variance usually implies squared unit, but 'latency_variance' is often used interchangeably in requested JSONs. Let's return StdDev for usability.
}

function calculateSessionDuration(events) {
    if (!events.length) return 1800000; // Default 30 mins if no events
    const sorted = events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const start = new Date(sorted[0].timestamp);
    const end = new Date(sorted[sorted.length - 1].timestamp);
    return Math.max(60000, end - start); // Min 1 minute
}

/**
 * Process raw reflex test data into scored metrics
 * @param {Object} clientData 
 */
function processReflexMetrics(clientData) {
    if (!clientData) return null;

    const { reactionTimeMs, accuracyScore, strokeConsistency, correctionCount } = clientData;

    // Simple heuristical scoring
    // Reaction Time: < 200ms is superhuman (0.0), 250ms is excellent (1.0), 500ms is slow (0.0)
    let reflexScore = 1.0 - Math.max(0, (reactionTimeMs - 200) / 300);
    reflexScore = Math.max(0, Math.min(1, reflexScore));

    const motorControlScore = (strokeConsistency || 0.5);

    // Attention: Penalize corrections and low accuracy
    let attentionScore = (accuracyScore || 0) - ((correctionCount || 0) * 0.05);
    attentionScore = Math.max(0, attentionScore);

    // Fatigue: Slow reaction + low accuracy
    const fatigueIndicator = reactionTimeMs > 450 && accuracyScore < 0.7;

    return {
        reactionTimeMs,
        accuracyScore,
        strokeConsistency,
        correctionCount,

        reflexScore: parseFloat(reflexScore.toFixed(2)),
        motorControlScore: parseFloat(motorControlScore.toFixed(2)),
        attentionScore: parseFloat(attentionScore.toFixed(2)),
        fatigueIndicator
    };
}

module.exports = {
    processTelemetryBatch,
    generateBehavioralReport,
    processReflexMetrics
};
