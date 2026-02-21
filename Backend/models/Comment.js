const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },
    likeCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: 1 }); // For fetching comments

const SimpleDB = require('../utils/SimpleDB');
const CommentMock = new SimpleDB('comments');
const CommentModel = mongoose.model('Comment', commentSchema);

module.exports = new Proxy(CommentModel, {
    get: function (target, prop) {
        if (global.USE_MOCK_DB) {
            if (prop === 'find') return (query) => CommentMock.find(query);
            if (prop === 'findOne') return (query) => CommentMock.findOne(query);
            if (prop === 'findById') return (id) => CommentMock.findById(id);
            if (prop === 'create') return (doc) => CommentMock.create(doc);
            if (prop === 'countDocuments') return (query) => CommentMock.countDocuments(query);
        }
        return target[prop];
    },
    construct: function (target, [doc]) {
        if (global.USE_MOCK_DB) {
            const instance = { ...doc };
            instance.save = async function () {
                const saved = await CommentMock.create(this);
                Object.assign(this, saved);
                return this;
            };
            instance.populate = async () => instance; // Basic populate
            return instance;
        }
        return new target(doc);
    }
});
