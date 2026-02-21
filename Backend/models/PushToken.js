const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        platform: {
            type: String,
            enum: ['ios', 'android', 'web'],
            required: true,
        },
        deviceInfo: {
            brand: String,
            modelName: String,
            osVersion: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastUsed: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
pushTokenSchema.index({ userId: 1, isActive: 1 });

// Method to deactivate token
pushTokenSchema.methods.deactivate = function () {
    this.isActive = false;
    return this.save();
};

// Static method to clean up old inactive tokens
pushTokenSchema.statics.cleanupOldTokens = async function (daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return this.deleteMany({
        isActive: false,
        updatedAt: { $lt: cutoffDate },
    });
};

module.exports = mongoose.model('PushToken', pushTokenSchema);
