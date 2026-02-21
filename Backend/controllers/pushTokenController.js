const PushToken = require('../models/PushToken');

/**
 * Register or update a push notification token
 */
exports.registerToken = async (req, res) => {
    try {
        const { token, platform, deviceInfo } = req.body;
        const userId = req.user._id;

        if (!token || !platform) {
            return res.status(400).json({
                success: false,
                message: 'Token and platform are required',
            });
        }

        // Check if token already exists
        let pushToken = await PushToken.findOne({ token });

        if (pushToken) {
            // Update existing token
            pushToken.userId = userId;
            pushToken.platform = platform;
            pushToken.deviceInfo = deviceInfo;
            pushToken.isActive = true;
            pushToken.lastUsed = new Date();
            await pushToken.save();
        } else {
            // Create new token
            pushToken = await PushToken.create({
                userId,
                token,
                platform,
                deviceInfo,
            });
        }

        res.json({
            success: true,
            message: 'Push token registered successfully',
            data: pushToken,
        });
    } catch (error) {
        console.error('Error registering push token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register push token',
            error: error.message,
        });
    }
};

/**
 * Get all tokens for a user
 */
exports.getUserTokens = async (req, res) => {
    try {
        const userId = req.user._id;

        const tokens = await PushToken.find({
            userId,
            isActive: true,
        }).select('-__v');

        res.json({
            success: true,
            data: tokens,
        });
    } catch (error) {
        console.error('Error fetching user tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tokens',
            error: error.message,
        });
    }
};

/**
 * Deactivate a push token
 */
exports.deactivateToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user._id;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required',
            });
        }

        const pushToken = await PushToken.findOne({ token, userId });

        if (!pushToken) {
            return res.status(404).json({
                success: false,
                message: 'Token not found',
            });
        }

        await pushToken.deactivate();

        res.json({
            success: true,
            message: 'Token deactivated successfully',
        });
    } catch (error) {
        console.error('Error deactivating token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate token',
            error: error.message,
        });
    }
};

/**
 * Clean up old inactive tokens (admin only)
 */
exports.cleanupTokens = async (req, res) => {
    try {
        const result = await PushToken.cleanupOldTokens();

        res.json({
            success: true,
            message: 'Token cleanup completed',
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Error cleaning up tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup tokens',
            error: error.message,
        });
    }
};
