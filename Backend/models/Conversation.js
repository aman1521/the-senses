const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ConversationSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    participants: [{
        type: String, // UserIds
        ref: 'User',
        required: true
    }],
    lastMessage: {
        content: String,
        sender: String,
        createdAt: Date,
        read: Boolean
    },
    channelType: {
        type: String,
        enum: ['direct', 'system', 'group'],
        default: 'direct'
    },
    archivedBy: [{
        type: String, // UserIds
    }],
    updatedAt: {
        type: Date,
        default: Date.now,
        index: -1
    }
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
