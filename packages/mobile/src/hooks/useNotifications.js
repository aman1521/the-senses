import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
    registerForPushNotificationsAsync,
    clearBadgeCount,
} from '../services/notificationService';

/**
 * Custom hook for managing push notifications
 * @param {Function} onNotificationReceived - Callback when notification is received
 * @param {Function} onNotificationResponse - Callback when user taps notification
 * @returns {Object} - Push token and notification utilities
 */
export const useNotifications = (
    onNotificationReceived = null,
    onNotificationResponse = null
) => {
    const [expoPushToken, setExpoPushToken] = useState(null);
    const [notification, setNotification] = useState(null);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        // Register for push notifications
        registerForPushNotificationsAsync()
            .then((token) => {
                setExpoPushToken(token);
            })
            .catch((error) => {
                console.error('Error registering for notifications:', error);
            });

        // Listener for notifications received while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                setNotification(notification);
                if (onNotificationReceived) {
                    onNotificationReceived(notification);
                }
            }
        );

        // Listener for when user taps on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                if (onNotificationResponse) {
                    onNotificationResponse(data, response);
                }
            }
        );

        // Clear badge count when app opens
        clearBadgeCount();

        return () => {
            // Cleanup listeners
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    return {
        expoPushToken,
        notification,
    };
};
