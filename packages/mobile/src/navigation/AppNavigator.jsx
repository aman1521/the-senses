import React, { forwardRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TestScreen from '../screens/TestScreen';
import ResultsScreen from '../screens/ResultsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import TouchInteractionTest from '../screens/TouchInteractionTest';

const Stack = createStackNavigator();

const AppNavigator = forwardRef((props, ref) => {
    return (
        <NavigationContainer ref={ref}>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#6366f1',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'The Senses' }}
                />
                <Stack.Screen
                    name="Test"
                    component={TestScreen}
                    options={{
                        title: 'Test Session',
                        headerLeft: null, // Prevent going back during test
                    }}
                />
                <Stack.Screen
                    name="Results"
                    component={ResultsScreen}
                    options={{ title: 'Your Results' }}
                />
                <Stack.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ title: 'Profile' }}
                />
                <Stack.Screen
                    name="TouchTest"
                    component={TouchInteractionTest}
                    options={{ title: 'Touch Interaction Test' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
});

export default AppNavigator;
