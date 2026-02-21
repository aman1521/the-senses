const mongoose = require('mongoose');
const crypto = require('crypto');

const teamInviteSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null,
        },
        role: {
            type: String,
            enum: ['member', 'analyst', 'admin', 'lead'],
            default: 'member',
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        acceptedAt: {
            type: Date,
        },
        acceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
teamInviteSchema.index({ email: 1, organization: 1 });
teamInviteSchema.index({ token: 1 });
teamInviteSchema.index({ status: 1, expiresAt: 1 });

// Generate unique invite token
teamInviteSchema.statics.generateToken = function () {
    return crypto.randomBytes(32).toString('hex');
};

// Method to check if invite is valid
teamInviteSchema.methods.isValid = function () {
    return (
        this.status === 'pending' &&
        this.expiresAt > new Date()
    );
};

// Method to accept invite
teamInviteSchema.methods.accept = async function (userId) {
    if (!this.isValid()) {
        throw new Error('Invite is no longer valid');
    }

    this.status = 'accepted';
    this.acceptedAt = new Date();
    this.acceptedBy = userId;
    await this.save();

    return this;
};

// Method to decline invite
teamInviteSchema.methods.decline = async function () {
    this.status = 'declined';
    await this.save();
    return this;
};

// Static method to cleanup expired invites
teamInviteSchema.statics.cleanupExpired = async function () {
    const result = await this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: new Date() },
        },
        {
            $set: { status: 'expired' },
        }
    );

    return result;
};

// Static method to find pending invites by email
teamInviteSchema.statics.findPendingByEmail = function (email) {
    return this.find({
        email: email.toLowerCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() },
    }).populate('organization team invitedBy');
};

module.exports = mongoose.model('TeamInvite', teamInviteSchema);
