const mongoose = require('mongoose');

const bubbleNodeSchema = new mongoose.Schema({
    bubble: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostBubble',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    parentNode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BubbleNode',
        default: null
    },
    depth: {
        type: Number,
        default: 0,
        min: 0
    },
    childCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for tree traversal
bubbleNodeSchema.index({ bubble: 1, parentNode: 1 });
bubbleNodeSchema.index({ bubble: 1, depth: 1 });
bubbleNodeSchema.index({ post: 1 });

module.exports = mongoose.model('BubbleNode', bubbleNodeSchema);
