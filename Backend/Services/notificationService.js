const { Expo } = require('expo-server-sdk');
const PushToken = require('../models/PushToken');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} notification.data - Additional data
 * @returns {Promise<Object>} Send result
 */
async function sendNotificationToUser(userId, { title, body, data = {} }) {
    try {
        // Get all active tokens for the user
        const pushTokens = await PushToken.find({
            userId,
            isActive: true,
        });

        if (pushTokens.length === 0) {
            console.log(`No active push tokens found for user ${userId}`);
            return {
                success: false,
                message: 'No active push tokens',
            };
        }

        // Create messages array
        const messages = [];

        for (const pushToken of pushTokens) {
            // Check if the token is valid
            if (!Expo.isExpoPushToken(pushToken.token)) {
                console.error(`Invalid Expo push token: ${pushToken.token}`);
                continue;
            }

            // Add message
            messages.push({
                to: pushToken.token,
                sound: 'default',
                title,
                body,
                data,
                priority: 'high',
            });

            // Update last used timestamp
            pushToken.lastUsed = new Date();
            await pushToken.save();
        }

        if (messages.length === 0) {
            return {
                success: false,
                message: 'No valid push tokens',
            };
        }

        // Send notifications in chunks
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }

        // Handle tickets
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const token = messages[i].to;

            if (ticket.status === 'error') {
                console.error(`Error sending to ${token}:`, ticket.message);

                // Deactivate invalid tokens
                if (ticket.details?.error === 'DeviceNotRegistered') {
                    await PushToken.findOneAndUpdate(
                        { token },
                        { isActive: false }
                    );
                }
            }
        }

        return {
            success: true,
            sentCount: messages.length,
            tickets,
        };
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
}

/**
 * Send notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Send result
 */
async function sendNotificationToMultipleUsers(userIds, notification) {
    const results = [];

    for (const userId of userIds) {
        try {
            const result = await sendNotificationToUser(userId, notification);
            results.push({ userId, ...result });
        } catch (error) {
            console.error(`Error sending to user ${userId}:`, error);
            results.push({
                userId,
                success: false,
                error: error.message,
            });
        }
    }

    return results;
}

/**
 * Notification Templates
 */
const NotificationTemplates = {
    testReminder: (hours) => ({
        title: 'Test Reminder 📝',
        body: `Don't forget to complete your scheduled test in ${hours} hours!`,
        data: { type: 'test_reminder' },
    }),

    testResultReady: () => ({
        title: 'Results Ready! 🎉',
        body: 'Your test results are now available. Tap to view.',
        data: { type: 'test_result_ready' },
    }),

    leaderboardUpdate: (rank) => ({
        title: 'Leaderboard Update 🏆',
        body: `You've moved to rank #${rank}! Keep it up!`,
        data: { type: 'leaderboard_update', rank },
    }),

    achievementUnlocked: (achievementName) => ({
        title: 'Achievement Unlocked! 🌟',
        body: `You've earned the "${achievementName}" achievement!`,
        data: { type: 'achievement_unlocked', achievement: achievementName },
    }),

    newChallenge: (challengeName) => ({
        title: 'New Challenge Available! 🎯',
        body: `Try the new "${challengeName}" challenge!`,
        data: { type: 'new_challenge', challenge: challengeName },
    }),

    friendRequest: (friendName) => ({
        title: 'New Friend Request 👋',
        body: `${friendName} wants to connect with you!`,
        data: { type: 'friend_request', friendName },
    }),
};

module.exports = {
    sendNotificationToUser,
    sendNotificationToMultipleUsers,
    NotificationTemplates,
    expo,
};
