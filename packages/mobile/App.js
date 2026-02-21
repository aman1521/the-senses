import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { useNotifications } from './src/hooks/useNotifications';
import { NotificationTypes } from './src/services/notificationService';

export default function App() {
  const navigationRef = useRef();

  // Handle notification received while app is open
  const handleNotificationReceived = (notification) => {
    console.log('Notification received:', notification);
    // You can show an in-app alert or banner here
  };

  // Handle notification tap
  const handleNotificationResponse = (data, response) => {
    console.log('Notification tapped:', data);

    // Navigate based on notification type
    if (navigationRef.current) {
      switch (data.type) {
        case NotificationTypes.TEST_REMINDER:
          navigationRef.current.navigate('Test');
          break;
        case NotificationTypes.TEST_RESULT_READY:
          navigationRef.current.navigate('Results');
          break;
        case NotificationTypes.LEADERBOARD_UPDATE:
          navigationRef.current.navigate('Home');
          break;
        default:
          navigationRef.current.navigate('Home');
      }
    }
  };

  // Register for notifications and set up listeners
  const { expoPushToken } = useNotifications(
    handleNotificationReceived,
    handleNotificationResponse
  );

  // Log push token (send this to your backend)
  if (expoPushToken) {
    console.log('Expo Push Token:', expoPushToken);
    // TODO: Send token to backend
    // sendPushTokenToBackend(expoPushToken, userId);
  }

  return (
    <>
      <AppNavigator ref={navigationRef} />
      <StatusBar style="auto" />
    </>
  );
}

