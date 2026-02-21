import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications and get Expo push token
 * @returns {Promise<string|null>} Push token or null if registration failed
 */
export async function registerForPushNotificationsAsync() {
    let token = null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        try {
            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas?.projectId,
                })
            ).data;
            console.log('Push token:', token);
        } catch (error) {
            console.error('Error getting push token:', error);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Schedule a local notification
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} options.data - Additional data
 * @param {number} options.seconds - Seconds until notification (default: 0 = immediate)
 */
export async function scheduleLocalNotification({
    title,
    body,
    data = {},
    seconds = 0,
}) {
    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: seconds > 0 ? { seconds } : null,
    });

    return identifier;
}

/**
 * Cancel a scheduled notification
 * @param {string} identifier - Notification identifier
 */
export async function cancelNotification(identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 * @returns {Promise<Array>} Array of scheduled notifications
 */
export async function getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set badge count (iOS)
 * @param {number} count - Badge count
 */
export async function setBadgeCount(count) {
    if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
    }
}

/**
 * Clear badge count (iOS)
 */
export async function clearBadgeCount() {
    if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(0);
    }
}

/**
 * Send push token to backend
 * @param {string} token - Expo push token
 * @param {string} userId - User ID
 */
export async function sendPushTokenToBackend(token, userId) {
    try {
        // Replace with your backend API endpoint
        const response = await fetch('YOUR_BACKEND_URL/api/push-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                userId,
                platform: Platform.OS,
                deviceInfo: {
                    brand: Device.brand,
                    modelName: Device.modelName,
                    osVersion: Device.osVersion,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to send push token to backend');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending push token to backend:', error);
        throw error;
    }
}

/**
 * Notification types for The Senses app
 */
export const NotificationTypes = {
    TEST_REMINDER: 'test_reminder',
    TEST_RESULT_READY: 'test_result_ready',
    LEADERBOARD_UPDATE: 'leaderboard_update',
    NEW_CHALLENGE: 'new_challenge',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    FRIEND_REQUEST: 'friend_request',
};

/**
 * Send test reminder notification
 * @param {number} hours - Hours until test
 */
export async function sendTestReminder(hours = 24) {
    return await scheduleLocalNotification({
        title: 'Test Reminder 📝',
        body: `Don't forget to complete your scheduled test in ${hours} hours!`,
        data: { type: NotificationTypes.TEST_REMINDER },
        seconds: hours * 3600,
    });
}

/**
 * Send test result ready notification
 */
export async function sendTestResultNotification() {
    return await scheduleLocalNotification({
        title: 'Results Ready! 🎉',
        body: 'Your test results are now available. Tap to view.',
        data: { type: NotificationTypes.TEST_RESULT_READY },
        seconds: 0,
    });
}

/**
 * Send leaderboard update notification
 * @param {number} newRank - User's new rank
 */
export async function sendLeaderboardUpdate(newRank) {
    return await scheduleLocalNotification({
        title: 'Leaderboard Update 🏆',
        body: `You've moved to rank #${newRank}! Keep it up!`,
        data: { type: NotificationTypes.LEADERBOARD_UPDATE, rank: newRank },
        seconds: 0,
    });
}

/**
 * Send achievement unlocked notification
 * @param {string} achievementName - Name of the achievement
 */
export async function sendAchievementNotification(achievementName) {
    return await scheduleLocalNotification({
        title: 'Achievement Unlocked! 🌟',
        body: `You've earned the "${achievementName}" achievement!`,
        data: { type: NotificationTypes.ACHIEVEMENT_UNLOCKED, achievement: achievementName },
        seconds: 0,
    });
}
