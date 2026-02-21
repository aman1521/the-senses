const mongoose = require('mongoose');

const postBubbleSchema = new mongoose.Schema({
    originPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    topicLabel: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 500
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Bubble Status
    status: {
        type: String,
        enum: ['active', 'archived', 'featured'],
        default: 'active'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },

    // Category & Tags
    category: {
        type: String,
        enum: ['general', 'career', 'learning', 'ai', 'technology', 'philosophy', 'other'],
        default: 'general'
    },
    tags: [String],

    // Participants & Engagement
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    participantCount: {
        type: Number,
        default: 1
    },
    postCount: {
        type: Number,
        default: 1
    },

    // Engagement Metrics
    engagement: {
        totalViews: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },
        totalShares: { type: Number, default: 0 }
    },

    // Trending Score (calculated)
    trendingScore: {
        type: Number,
        default: 0
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    },

    // Moderation
    reported: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
postBubbleSchema.index({ createdBy: 1, createdAt: -1 });
postBubbleSchema.index({ status: 1, createdAt: -1 });
postBubbleSchema.index({ topicLabel: 'text', description: 'text' });
postBubbleSchema.index({ trendingScore: -1, lastActivityAt: -1 });
postBubbleSchema.index({ isFeatured: 1, createdAt: -1 });
postBubbleSchema.index({ category: 1 });
postBubbleSchema.index({ tags: 1 });

// Method to calculate trending score
postBubbleSchema.methods.calculateTrendingScore = function () {
    const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
    const recencyFactor = Math.max(0, 1 - (ageInHours / 168)); // Decay over 7 days

    const engagementScore = (
        this.engagement.totalViews * 0.1 +
        this.engagement.totalLikes * 2 +
        this.engagement.totalComments * 5 +
        this.engagement.totalShares * 10
    );

    const activityScore = this.participantCount * 3 + this.postCount * 2;

    this.trendingScore = Math.round(
        (engagementScore + activityScore) * recencyFactor
    );

    return this.trendingScore;
};

// Method to add participant
postBubbleSchema.methods.addParticipant = async function (userId) {
    if (!this.participants.includes(userId)) {
        this.participants.push(userId);
        this.participantCount = this.participants.length;
        await this.save();
    }
};

// Method to increment post count
postBubbleSchema.methods.incrementPostCount = async function () {
    this.postCount += 1;
    this.lastActivityAt = new Date();
    this.calculateTrendingScore();
    await this.save();
};

module.exports = mongoose.model('PostBubble', postBubbleSchema);
