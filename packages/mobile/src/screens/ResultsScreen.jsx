import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';

const ResultsScreen = ({ navigation }) => {
    // Mock data - replace with actual API call
    const results = [
        {
            id: 1,
            date: '2026-02-10',
            score: 85,
            rank: 1250,
            integrityScore: 98,
        },
        {
            id: 2,
            date: '2026-02-05',
            score: 78,
            rank: 2100,
            integrityScore: 100,
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Your Test Results</Text>

                {results.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No test results yet</Text>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => navigation.navigate('Test')}
                        >
                            <Text style={styles.startButtonText}>Take Your First Test</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.resultsContainer}>
                        {results.map((result) => (
                            <View key={result.id} style={styles.resultCard}>
                                <View style={styles.resultHeader}>
                                    <Text style={styles.resultDate}>{result.date}</Text>
                                    <Text style={styles.resultScore}>{result.score}/100</Text>
                                </View>
                                <View style={styles.resultDetails}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Global Rank</Text>
                                        <Text style={styles.detailValue}>#{result.rank}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Integrity</Text>
                                        <Text style={styles.detailValue}>{result.integrityScore}%</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#6b7280',
        marginBottom: 30,
    },
    startButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 30,
        paddingVertical: 16,
        borderRadius: 12,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    resultsContainer: {
        gap: 15,
    },
    resultCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    resultDate: {
        fontSize: 16,
        color: '#6b7280',
    },
    resultScore: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    resultDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 5,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
});

export default ResultsScreen;
