import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.heroSection}
                >
                    <Text style={styles.heroTitle}>Welcome to The Senses</Text>
                    <Text style={styles.heroSubtitle}>
                        Test your cognitive abilities and compete with others
                    </Text>
                </LinearGradient>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Test')}
                    >
                        <Text style={styles.primaryButtonText}>Start New Test</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.secondaryButtonText}>View Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Results')}
                    >
                        <Text style={styles.secondaryButtonText}>Past Results</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, styles.testButton]}
                        onPress={() => navigation.navigate('TouchTest')}
                    >
                        <Text style={styles.secondaryButtonText}>🧪 Touch Interaction Test</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>Your Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Tests Taken</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>--</Text>
                            <Text style={styles.statLabel}>Average Score</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>--</Text>
                            <Text style={styles.statLabel}>Global Rank</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        padding: 40,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#e0e7ff',
        textAlign: 'center',
    },
    actionsContainer: {
        padding: 20,
        gap: 15,
    },
    primaryButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    statsContainer: {
        padding: 20,
    },
    statsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
});

export default HomeScreen;
