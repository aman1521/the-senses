const mongoose = require('mongoose');

const DetectedDeviceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['phone', 'tablet', 'smartwatch', 'earbuds', 'second_screen', 'notes', 'other_person', 'suspicious_reflection', 'unknown'],
        required: true
    },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    location: { type: String }, // Description of where in frame
    inUse: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const VideoIntroSchema = new mongoose.Schema({
    sessionId: { type: String, ref: 'TestSession', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoUrl: { type: String, required: true },
    durationSeconds: { type: Number },

    // Face Analysis
    facePresenceRatio: { type: Number, default: 0, min: 0, max: 1 },
    multipleFacesDetected: { type: Boolean, default: false },

    // Audio Analysis
    audioDetected: { type: Boolean, default: false },
    multipleVoicesDetected: { type: Boolean, default: false },

    // Eye Contact & Focus
    eyeContactScore: { type: Number, min: 0, max: 100, default: 50 },
    lookingAwayFrequency: {
        type: String,
        enum: ['never', 'occasionally', 'frequently'],
        default: 'never'
    },

    // Device Detection (NEW)
    deviceDetection: {
        devicesFound: { type: Boolean, default: false },
        devices: [DetectedDeviceSchema],
        deviceCount: { type: Number, default: 0 },
        highRiskDevice: { type: Boolean, default: false }
    },

    // Environment Check
    environmentCheck: {
        backgroundClean: { type: Boolean, default: true },
        lightingAdequate: { type: Boolean, default: true },
        suspiciousMovement: { type: Boolean, default: false }
    },

    // Overall Scores
    suspicionScore: { type: Number, min: 0, max: 100, default: 0 },
    integrityScore: { type: Number, min: 0, max: 100, default: 100 },

    // Notes & Status
    integrityNotes: { type: String },
    analysisStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'manual_review'],
        default: 'pending'
    },
    analyzedAt: { type: Date },

    // Flags for review
    flaggedForReview: { type: Boolean, default: false },
    reviewNotes: { type: String }

}, { timestamps: true });

// Index for quick lookups
VideoIntroSchema.index({ sessionId: 1 });
VideoIntroSchema.index({ userId: 1 });
VideoIntroSchema.index({ 'deviceDetection.devicesFound': 1 });
VideoIntroSchema.index({ flaggedForReview: 1 });

module.exports = mongoose.model('VideoIntro', VideoIntroSchema);

