const mongoose = require('mongoose');

const postSaveSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Ensure unique save per post per user
postSaveSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('PostSave', postSaveSchema);
