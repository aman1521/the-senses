import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';

const ProfileScreen = ({ navigation }) => {
    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                onPress: () => navigation.replace('Login'),
                style: 'destructive',
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>U</Text>
                    </View>
                    <Text style={styles.userName}>User Name</Text>
                    <Text style={styles.userEmail}>user@example.com</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Statistics</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Tests</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>--</Text>
                            <Text style={styles.statLabel}>Avg Score</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>--</Text>
                            <Text style={styles.statLabel}>Rank</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuText}>Privacy</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
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
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#6b7280',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 15,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginHorizontal: 5,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
    },
    menuItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    menuText: {
        fontSize: 16,
        color: '#374151',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default ProfileScreen;
