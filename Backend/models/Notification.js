const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['market_update', 'social_like', 'social_comment', 'achievement', 'system', 'challenge'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
        link: String,
        relatedId: String, // ID of the market update, post, or result
        metadata: mongoose.Schema.Types.Mixed
    },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: '30d' } // Auto-delete after 30 days
});

module.exports = mongoose.model('Notification', notificationSchema);
