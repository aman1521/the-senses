const mongoose = require('mongoose');

const ApiTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    // SHA-256 hash of the raw token — raw token is NEVER stored
    tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    scopes: {
        type: [String],
        default: ['read:profile', 'read:results'],
        enum: [
            'read:profile',
            'read:results',
            'read:analytics',
            'write:profile',
            'admin'
        ]
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    expiresAt: {
        type: Date,
        default: null // null = never expires
    },
    lastUsedAt: {
        type: Date,
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Auto-expire via TTL only if expiresAt is set
ApiTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('ApiToken', ApiTokenSchema);
