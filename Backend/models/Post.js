const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 5000
    },

    // Post Type & Context - CULTURE BLUEPRINT UPDATE
    postType: {
        type: String,
        enum: ['insight', 'question', 'challenge', 'debate', 'knowledge_thread', 'standalone', 'bubble', 'share'],
        default: 'insight'
    },

    // Cognitive Intent (Nuanced thinking type)
    intent: {
        type: String,
        enum: ['insight', 'question', 'analysis', 'debate_invitation', 'data_claim', 'generic'],
        default: 'generic'
    },

    // Debate Specifics
    debateStance: {
        type: String, // e.g. "For", "Against"
        enum: ['for', 'against', 'neutral', null],
        default: null
    },
    debateWinner: { type: Boolean, default: false }, // If discussion concluded

    // Knowledge & Depth
    depthScore: { type: Number, default: 0, index: true }, // AI-rated analysis depth
    reasoningClarity: { type: Number, default: 0 }, // AI-rated clarity

    bubble: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostBubble',
        default: null
    },

    // Sharing & Quoting
    quotedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    sharedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },

    // Rich Media
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document'],
        },
        url: String,
        caption: String
    }],

    // Categorization
    domain: { type: String, required: false }, // e.g. "AI Strategy", "Macroeconomics"
    tags: [String],
    category: { // Cognitive Category
        type: String,
        enum: ['analytical', 'strategic', 'creative', 'logical', 'general', 'career', 'learning', 'ai', 'technology', 'philosophy', 'other'],
        default: 'general'
    },

    // Scheduling & Publishing
    isPublished: { type: Boolean, default: true },
    scheduledAt: { type: Date, default: null },

    // Visibility & Privacy
    visibility: {
        type: String,
        enum: ['public', 'connections', 'private'],
        default: 'public'
    },

    // Engagement Metrics
    engagement: {
        likes: { type: Number, default: 0 },
        weightedLikes: { type: Number, default: 0 }, // Impact-adjusted likes
        shares: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        views: { type: Number, default: 0 }
    },

    // Who liked this post (for checking if user already liked)
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Saves
    savedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Who shared this post
    sharedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        shareNote: String
    }],

    // Hybrid Feed Attributes
    cognitiveDepth: {
        type: String,
        enum: ['surface', 'opinion', 'insightful', 'analytical', 'strategic'],
        default: 'surface'
    },
    travelPhase: {
        type: Number,
        default: 1, // 1: Inner Circle, 2: Domain Expansion, 3: Global
        index: true
    },
    embedding: {
        type: [Number], // Vector for semantic search/interest matching
        select: false // Hide by default for performance
    },

    // Moderation
    reported: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0
    },

    // Analytics
    analyticsData: {
        impressions: { type: Number, default: 0 },
        clickThroughRate: { type: Number, default: 0 },
        avgReadTime: { type: Number, default: 0 } // Dwell time in seconds
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    // Cognitive & Ranking Metrics (New)
    engagementScore: { type: Number, default: 0, index: true },
    cognitiveWeight: { type: Number, default: 0 },
    isVerifiedContent: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Indexes for efficient queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ bubble: 1, createdAt: -1 });
postSchema.index({ quotedPost: 1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ category: 1 });

// Virtuals removed in favor of stored fields for performance

// Method to check if user liked this post
postSchema.methods.isLikedBy = function (userId) {
    return this.likedBy.some(id => id.toString() === userId.toString());
};

// Method to increment view count
postSchema.methods.incrementViews = async function () {
    this.engagement.views += 1;
    this.analyticsData.impressions += 1;
    await this.save();
};

const SimpleDB = require('../utils/SimpleDB');
const PostMock = new SimpleDB('posts');

const PostModel = mongoose.model('Post', postSchema);

// Proxy to switch between Mongoose and SimpleDB based on global flag
module.exports = new Proxy(PostModel, {
    get: function (target, prop) {
        if (global.USE_MOCK_DB) {
            // Map static Mongoose methods to SimpleDB methods
            if (prop === 'find') return (query) => PostMock.find(query);
            if (prop === 'findOne') return (query) => PostMock.findOne(query);
            if (prop === 'findById') return (id) => PostMock.findById(id);
            if (prop === 'create') return (doc) => PostMock.create(doc);
            if (prop === 'exists') return (query) => PostMock.exists(query);
            if (prop === 'countDocuments') return () => Promise.resolve(PostMock.data.length);
        }
        return target[prop];
    },
    construct: function (target, [doc]) {
        if (global.USE_MOCK_DB) {
            // Mimic Mongoose Document instance if "new Post()" is called
            // We return a plain object that has a save() method
            const instance = { ...doc };

            // Define save method that mutates the instance (Mongoose behavior)
            instance.save = async function () {
                const saved = await PostMock.create(this);
                this._id = saved._id;
                this.createdAt = saved.createdAt;
                this.updatedAt = saved.updatedAt;
                return this;
            };

            instance.populate = async () => instance; // Mock populate (no-op)
            return instance;
        }
        return new target(doc);
    }
});
