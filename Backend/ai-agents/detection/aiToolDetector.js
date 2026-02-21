// ai-agents/detection/aiToolDetector.js
// Detects patterns suggesting use of AI tools (ChatGPT, Claude, etc.)
// Analyzes response timing, tab switching patterns, and copy-paste behavior

/**
 * AI Tool Detection Heuristics
 * 
 * Signs of AI tool usage:
 * 1. Rapid tab switches with ~5-15 second delays (query -> AI -> copy answer)
 * 2. Suspiciously fast complex answers after tab switch
 * 3. Clipboard activity (paste events)
 * 4. Consistent patterns of: view question -> switch tab -> return -> answer
 */

// Known AI tool domain patterns (for clipboard/URL detection if available)
const AI_TOOL_DOMAINS = [
    'chat.openai.com',
    'chatgpt.com',
    'claude.ai',
    'bard.google.com',
    'gemini.google.com',
    'perplexity.ai',
    'copilot.microsoft.com',
    'bing.com/chat',
    'you.com',
    'poe.com',
    'character.ai',
    'phind.com',
    'writesonic.com',
    'jasper.ai',
    'notion.so', // Has AI
    'quillbot.com'
];

// Suspicious timing patterns (in milliseconds)
const SUSPICIOUS_PATTERNS = {
    MIN_AI_QUERY_TIME: 5000,      // Minimum time to type query and get response
    MAX_AI_QUERY_TIME: 30000,     // Maximum realistic AI query time
    SUSPICIOUSLY_FAST_ANSWER: 2000, // If answered within 2s of returning, likely copy-paste
    RAPID_TAB_SWITCH_WINDOW: 3000   // Multiple switches within 3 seconds
};

class AIToolDetectionSession {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.events = [];
        this.tabSwitchHistory = [];
        this.answerTimings = [];
        this.pasteEvents = [];
        this.suspicionLevel = 0;
        this.flags = [];
    }

    /**
     * Log a tab switch event
     * @param {Object} event - {type: 'leave'|'return', timestamp: Date, questionNumber: number}
     */
    logTabSwitch(event) {
        this.tabSwitchHistory.push({
            ...event,
            timestamp: event.timestamp || Date.now()
        });

        // Analyze pattern when user returns
        if (event.type === 'return') {
            this._analyzeTabPattern();
        }
    }

    /**
     * Log when user answers a question
     * @param {Object} event - {questionNumber, timestamp, timeOnQuestion}
     */
    logAnswer(event) {
        const lastTabReturn = this.tabSwitchHistory
            .filter(e => e.type === 'return')
            .pop();

        if (lastTabReturn) {
            const timeSinceReturn = event.timestamp - lastTabReturn.timestamp;

            this.answerTimings.push({
                questionNumber: event.questionNumber,
                timeOnQuestion: event.timeOnQuestion,
                timeSinceTabReturn: timeSinceReturn,
                tabSwitchBeforeAnswer: timeSinceReturn < 60000 // Tab switch within last minute
            });

            // Suspiciously fast answer after tab return
            if (timeSinceReturn < SUSPICIOUS_PATTERNS.SUSPICIOUSLY_FAST_ANSWER) {
                this.suspicionLevel += 15;
                this.flags.push({
                    type: 'fast_answer_after_tab',
                    severity: 'high',
                    timestamp: event.timestamp,
                    details: `Answered Q${event.questionNumber} ${timeSinceReturn}ms after returning`
                });
            }
        }
    }

    /**
     * Log a paste event
     * @param {Object} event - {timestamp, questionNumber, textLength}
     */
    logPasteEvent(event) {
        this.pasteEvents.push({
            ...event,
            timestamp: event.timestamp || Date.now()
        });

        // Paste after tab switch is suspicious
        const recentTabSwitch = this.tabSwitchHistory
            .filter(e => (Date.now() - e.timestamp) < 30000)
            .length > 0;

        if (recentTabSwitch) {
            this.suspicionLevel += 10;
            this.flags.push({
                type: 'paste_after_tab_switch',
                severity: 'medium',
                timestamp: Date.now(),
                details: `Paste detected after recent tab switch on Q${event.questionNumber}`
            });
        }

        // Long paste is suspicious
        if (event.textLength > 100) {
            this.suspicionLevel += 5;
            this.flags.push({
                type: 'long_paste',
                severity: 'low',
                timestamp: Date.now(),
                details: `Long paste (${event.textLength} chars) detected`
            });
        }
    }

    /**
     * Analyze tab switching patterns for AI tool usage
     * @private
     */
    _analyzeTabPattern() {
        const recentSwitches = this.tabSwitchHistory.filter(
            e => (Date.now() - e.timestamp) < 120000 // Last 2 minutes
        );

        // Pattern: Leave -> X seconds -> Return (typical AI query cycle)
        for (let i = 0; i < recentSwitches.length - 1; i++) {
            const leave = recentSwitches[i];
            const returnEvt = recentSwitches[i + 1];

            if (leave.type === 'leave' && returnEvt.type === 'return') {
                const awayTime = returnEvt.timestamp - leave.timestamp;

                // Time away matches typical AI query pattern
                if (awayTime >= SUSPICIOUS_PATTERNS.MIN_AI_QUERY_TIME &&
                    awayTime <= SUSPICIOUS_PATTERNS.MAX_AI_QUERY_TIME) {
                    this.suspicionLevel += 5;
                    this.flags.push({
                        type: 'ai_query_timing_pattern',
                        severity: 'medium',
                        timestamp: returnEvt.timestamp,
                        details: `Tab switch pattern matches AI query timing (${Math.round(awayTime / 1000)}s)`
                    });
                }
            }
        }

        // Multiple rapid switches
        const rapidSwitches = recentSwitches.filter(
            (e, i, arr) => i > 0 && (e.timestamp - arr[i - 1].timestamp) < SUSPICIOUS_PATTERNS.RAPID_TAB_SWITCH_WINDOW
        );

        if (rapidSwitches.length >= 3) {
            this.suspicionLevel += 10;
            this.flags.push({
                type: 'rapid_tab_switching',
                severity: 'high',
                timestamp: Date.now(),
                details: `${rapidSwitches.length} rapid tab switches detected`
            });
        }
    }

    /**
     * Get comprehensive AI tool usage analysis
     * @returns {Object} Analysis result
     */
    getAnalysis() {
        const suspiciousAnswers = this.answerTimings.filter(a => a.timeSinceTabReturn < 5000);
        const tabSwitchCount = this.tabSwitchHistory.filter(e => e.type === 'leave').length;

        // Calculate risk level
        let riskLevel = 'low';
        if (this.suspicionLevel >= 50) riskLevel = 'critical';
        else if (this.suspicionLevel >= 30) riskLevel = 'high';
        else if (this.suspicionLevel >= 15) riskLevel = 'medium';

        // Determine likely AI tool usage
        const likelyAiUsage =
            this.suspicionLevel >= 30 ||
            suspiciousAnswers.length >= 3 ||
            (tabSwitchCount >= 5 && this.pasteEvents.length >= 2);

        return {
            sessionId: this.sessionId,
            suspicionScore: Math.min(this.suspicionLevel, 100),
            riskLevel,
            likelyAiToolUsage: likelyAiUsage,
            metrics: {
                tabSwitchCount,
                pasteEventCount: this.pasteEvents.length,
                suspiciousAnswerCount: suspiciousAnswers.length,
                totalFlags: this.flags.length
            },
            flags: this.flags,
            integrityPenalty: Math.min(Math.floor(this.suspicionLevel / 2), 30),
            recommendation: likelyAiUsage ?
                'Manual review recommended - high likelihood of AI tool assistance' :
                riskLevel === 'high' ? 'Monitor closely - suspicious activity detected' :
                    'Normal activity patterns'
        };
    }

    /**
     * Reset session (for retakes)
     */
    reset() {
        this.events = [];
        this.tabSwitchHistory = [];
        this.answerTimings = [];
        this.pasteEvents = [];
        this.suspicionLevel = 0;
        this.flags = [];
    }
}

// Store active sessions
const activeSessions = new Map();

/**
 * Get or create a detection session
 * @param {string} sessionId - Unique session identifier
 * @returns {AIToolDetectionSession}
 */
function getSession(sessionId) {
    if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, new AIToolDetectionSession(sessionId));
    }
    return activeSessions.get(sessionId);
}

/**
 * Clean up old sessions (call periodically)
 */
function cleanupSessions() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [sessionId, session] of activeSessions.entries()) {
        const lastEvent = session.tabSwitchHistory[session.tabSwitchHistory.length - 1];
        if (!lastEvent || lastEvent.timestamp < oneHourAgo) {
            activeSessions.delete(sessionId);
        }
    }
}

// Cleanup every 30 minutes
setInterval(cleanupSessions, 30 * 60 * 1000);

module.exports = {
    AIToolDetectionSession,
    getSession,
    AI_TOOL_DOMAINS,
    SUSPICIOUS_PATTERNS,
    cleanupSessions
};
