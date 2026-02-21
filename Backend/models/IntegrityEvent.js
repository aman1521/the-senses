const mongoose = require('mongoose');

const IntegrityEventSchema = new mongoose.Schema({
    sessionId: { type: String, ref: 'TestSession', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stage: {
        type: String,
        enum: ['video', 'skill', 'psychology', 'intro', 'overall'],
        required: true
    },
    eventType: {
        type: String,
        enum: [
            // Browser events
            'tab_switch',
            'window_blur',
            'fullscreen_exit',
            'dev_tools',
            // Face events
            'face_missing',
            'multiple_faces',
            'looking_away',
            // Camera events
            'camera_off',
            'camera_blocked',
            // Device detection events (NEW)
            'phone_detected',
            'tablet_detected',
            'earbuds_detected',
            'smartwatch_detected',
            'notes_detected',
            'second_screen_detected',
            'other_person_detected',
            'suspicious_reflection',
            // Audio events
            'multiple_voices',
            'background_noise',
            // Environment events
            'suspicious_movement',
            'poor_lighting',
            // PHASE 0: Anti-Cheat Risk Signals
            'TIME_TOO_FAST',
            'TIME_SUSPICIOUSLY_FAST',
            'TIME_TOO_SLOW',
            'MULTIPLE_INSTANT_ANSWERS',
            'IDENTICAL_ANSWERS',
            'HIGH_ANSWER_REPETITION',
            'ALTERNATING_PATTERN',
            'SEQUENTIAL_PATTERN',
            'IMPOSSIBLE_PERFORMANCE',
            'PERFECT_SCORE_TOO_FAST',
            'EXCESSIVE_TAB_SWITCHING',
            'MODERATE_TAB_SWITCHING',
            'MULTIPLE_COPY_PASTE',
            'DEVTOOLS_OPEN',
            'RISK_ASSESSMENT',  // Overall risk score event
            // PHASE 5: Telemetry Events
            'visibility_change',
            'copy_event',
            'paste_event',
            'idle_start',
            'idle_end',
            'answer_submit',
            'devtools_detected',
            'app_backgrounded',
            'telemetry_batch' // For grouped events
        ],
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },
    details: { type: String }, // JSON stringified details

    // Context info
    questionNumber: { type: Number },
    timeIntoTest: { type: Number }, // Seconds since test started

    // Device-specific metadata
    deviceMetadata: {
        deviceType: { type: String },
        confidence: { type: Number, min: 0, max: 100 },
        location: { type: String },
        inActiveUse: { type: Boolean, default: false }
    },

    // Screenshot/frame URL if captured
    frameUrl: { type: String },

    // Review status
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
    falsePositive: { type: Boolean, default: false },

    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient queries
IntegrityEventSchema.index({ sessionId: 1, timestamp: -1 });
IntegrityEventSchema.index({ userId: 1 });
IntegrityEventSchema.index({ eventType: 1 });
IntegrityEventSchema.index({ severity: 1 });
IntegrityEventSchema.index({ reviewed: 1, severity: 1 });

module.exports = mongoose.model('IntegrityEvent', IntegrityEventSchema);

