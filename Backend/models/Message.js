const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MessageSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    conversationId: {
        type: String,
        required: true,
        index: true
    },
    sender: {
        type: String, // UserId (ref not enforced for flexibility in early stage)
        ref: 'User',
        required: true
    },
    recipient: {
        type: String,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    read: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['text', 'system', 'invite'],
        default: 'text'
    },
    metadata: {
        type: Object, // For invites or system messages (e.g., related entity ID)
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Create compound index for querying conversations
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Message', MessageSchema);
