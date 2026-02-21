const mongoose = require('mongoose');

const postImpressionSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, // Can be null for anonymous (but prompt implies user tracking)
        ref: 'User',
        required: true
    },
    dwellTimeSeconds: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

postImpressionSchema.index({ user: 1, post: 1 }); // To prevent double counting or analyze history

module.exports = mongoose.model('PostImpression', postImpressionSchema);
