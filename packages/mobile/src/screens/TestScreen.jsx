import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Platform,
    StatusBar,
    ActivityIndicator,
    Vibration,
    Animated,
    PanResponder,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const TestScreen = ({ navigation, route }) => {
    // Test State
    const [stage, setStage] = useState('intro'); // intro, device-check, recording, reaction, memory, questions, completed
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
    const [loading, setLoading] = useState(false);

    // Proctoring State
    const [hasPermission, setHasPermission] = useState(null);
    const [cameraRef, setCameraRef] = useState(null);
    const [recording, setRecording] = useState(null);
    const [integrityScore, setIntegrityScore] = useState(100);
    const [alerts, setAlerts] = useState([]);

    // Reaction Test State
    const [reactionStage, setReactionStage] = useState('waiting');
    const [reactionTime, setReactionTime] = useState(null);
    const [reactionScores, setReactionScores] = useState([]);
    const [reactionRound, setReactionRound] = useState(0);

    // Memory Test State
    const [memorySequence, setMemorySequence] = useState([]);
    const [userSequence, setUserSequence] = useState([]);
    const [memoryRound, setMemoryRound] = useState(0);
    const [showingSequence, setShowingSequence] = useState(false);

    // Drag and Drop State (for reordering questions)
    const pan = useRef(new Animated.ValueXY()).current;
    const [isDragging, setIsDragging] = useState(false);

    // Timer
    useEffect(() => {
        if (stage === 'questions' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [stage, timeLeft]);

    // Request Camera & Audio Permissions
    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: audioStatus } = await Audio.requestPermissionsAsync();
            setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');
        })();
    }, []);

    // Format Time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle Answer Selection
    const handleAnswer = (questionId, choice) => {
        Vibration.vibrate(10); // Haptic feedback
        setAnswers((prev) => ({
            ...prev,
            [questionId]: choice,
        }));
    };

    // ==================== REACTION TEST ====================
    const startReactionRound = () => {
        setReactionStage('waiting');
        const delay = Math.random() * 3000 + 2000; // Random delay 2-5 seconds

        setTimeout(() => {
            setReactionStage('ready');
            setReactionTime(Date.now());
        }, delay);
    };

    const handleReactionTap = () => {
        if (reactionStage === 'ready') {
            const elapsed = Date.now() - reactionTime;
            setReactionScores([...reactionScores, elapsed]);
            setReactionRound(reactionRound + 1);

            Vibration.vibrate(50);

            if (reactionRound + 1 >= 5) {
                setStage('memory');
            } else {
                startReactionRound();
            }
        } else if (reactionStage === 'waiting') {
            Alert.alert('Too Early!', 'Wait for the green signal');
            setReactionStage('failed');
            setTimeout(startReactionRound, 1000);
        }
    };

    useEffect(() => {
        if (stage === 'reaction') {
            startReactionRound();
        }
    }, [stage]);

    // ==================== MEMORY TEST ====================
    const generateMemorySequence = (length) => {
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(Math.floor(Math.random() * 9));
        }
        return sequence;
    };

    const showMemorySequence = async (sequence) => {
        setShowingSequence(true);
        for (let i = 0; i < sequence.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            // Flash visual feedback
            Vibration.vibrate(20);
        }
        setShowingSequence(false);
    };

    const handleMemoryTileClick = (index) => {
        if (showingSequence) return;

        Vibration.vibrate(10);
        const newUserSequence = [...userSequence, index];
        setUserSequence(newUserSequence);

        // Check if sequence matches
        if (newUserSequence.length === memorySequence.length) {
            const correct = newUserSequence.every((val, idx) => val === memorySequence[idx]);

            if (correct) {
                Alert.alert('Correct!', 'Well done!');
                if (memoryRound + 1 >= 3) {
                    loadQuestions();
                } else {
                    setMemoryRound(memoryRound + 1);
                    const newSeq = generateMemorySequence(3 + memoryRound + 1);
                    setMemorySequence(newSeq);
                    setUserSequence([]);
                    showMemorySequence(newSeq);
                }
            } else {
                Alert.alert('Wrong', 'Try again!');
                setUserSequence([]);
            }
        }
    };

    useEffect(() => {
        if (stage === 'memory') {
            const sequence = generateMemorySequence(3);
            setMemorySequence(sequence);
            showMemorySequence(sequence);
        }
    }, [stage]);

    // ==================== LOAD QUESTIONS ====================
    const loadQuestions = async () => {
        setLoading(true);
        setStage('questions');
        try {
            // Mock questions - replace with API call
            const mockQuestions = [
                {
                    id: 1,
                    question: 'What is the capital of France?',
                    options: ['London', 'Berlin', 'Paris', 'Madrid'],
                    type: 'multiple-choice',
                },
                {
                    id: 2,
                    question: 'Solve: 2 + 2 = ?',
                    options: ['3', '4', '5', '6'],
                    type: 'multiple-choice',
                },
            ];
            setQuestions(mockQuestions);
        } catch (error) {
            Alert.alert('Error', 'Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    // ==================== SUBMIT TEST ====================
    const handleSubmit = async () => {
        Alert.alert(
            'Submit Test',
            'Are you sure you want to submit?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Submit answers to backend
                            console.log('Submitting answers:', answers);
                            setStage('completed');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to submit test');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // ==================== DRAG AND DROP (Touch Gesture) ====================
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setIsDragging(true);
                Vibration.vibrate(20);
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gesture) => {
                setIsDragging(false);
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    // ==================== RENDER STAGES ====================
    if (hasPermission === null) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Requesting permissions...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Camera and Audio permissions are required</Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // INTRO STAGE
    if (stage === 'intro') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.introContainer}>
                    <Text style={styles.introTitle}>The Senses Test</Text>
                    <Text style={styles.introSubtitle}>
                        This test will evaluate your cognitive abilities through:
                    </Text>
                    <View style={styles.featureList}>
                        <Text style={styles.featureItem}>✓ Reaction Time Test</Text>
                        <Text style={styles.featureItem}>✓ Memory Test</Text>
                        <Text style={styles.featureItem}>✓ Intelligence Questions</Text>
                    </View>
                    <Text style={styles.warningText}>
                        ⚠️ This test is proctored. Your camera and audio will be monitored.
                    </Text>
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => setStage('reaction')}
                    >
                        <Text style={styles.startButtonText}>Start Test</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    // REACTION TEST STAGE
    if (stage === 'reaction') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.testHeader}>
                    <Text style={styles.testTitle}>Reaction Test</Text>
                    <Text style={styles.roundCounter}>Round {reactionRound + 1} / 5</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.reactionZone,
                        reactionStage === 'ready' && styles.reactionZoneReady,
                        reactionStage === 'waiting' && styles.reactionZoneWaiting,
                    ]}
                    onPress={handleReactionTap}
                    activeOpacity={0.8}
                >
                    <Text style={styles.reactionText}>
                        {reactionStage === 'waiting' && 'Wait...'}
                        {reactionStage === 'ready' && 'TAP NOW!'}
                        {reactionStage === 'failed' && 'Too Early!'}
                    </Text>
                </TouchableOpacity>

                {reactionScores.length > 0 && (
                    <View style={styles.scoresContainer}>
                        <Text style={styles.scoresTitle}>Your Times:</Text>
                        {reactionScores.map((score, idx) => (
                            <Text key={idx} style={styles.scoreItem}>
                                Round {idx + 1}: {score}ms
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        );
    }

    // MEMORY TEST STAGE
    if (stage === 'memory') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.testHeader}>
                    <Text style={styles.testTitle}>Memory Test</Text>
                    <Text style={styles.roundCounter}>Round {memoryRound + 1} / 3</Text>
                </View>

                <Text style={styles.memoryInstruction}>
                    {showingSequence ? 'Watch the sequence...' : 'Repeat the sequence'}
                </Text>

                <View style={styles.memoryGrid}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.memoryTile,
                                memorySequence.includes(index) && showingSequence && styles.memoryTileActive,
                                userSequence.includes(index) && !showingSequence && styles.memoryTileSelected,
                            ]}
                            onPress={() => handleMemoryTileClick(index)}
                            disabled={showingSequence}
                        >
                            <Text style={styles.memoryTileText}>{index + 1}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    // QUESTIONS STAGE
    if (stage === 'questions') {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            );
        }

        const question = questions[currentQuestion];

        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />

                {/* Header with Timer */}
                <View style={styles.questionHeader}>
                    <Text style={styles.questionCounter}>
                        Question {currentQuestion + 1} / {questions.length}
                    </Text>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    </View>
                </View>

                {/* Integrity Monitor */}
                <View style={styles.integrityBar}>
                    <Text style={styles.integrityText}>Integrity: {integrityScore}%</Text>
                </View>

                {/* Question */}
                <ScrollView style={styles.questionContainer}>
                    <Text style={styles.questionText}>{question?.question}</Text>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {question?.options.map((option, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.optionButton,
                                    answers[question.id] === option && styles.optionButtonSelected,
                                ]}
                                onPress={() => handleAnswer(question.id, option)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        answers[question.id] === option && styles.optionTextSelected,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                {/* Navigation */}
                <View style={styles.navigationContainer}>
                    <TouchableOpacity
                        style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
                        onPress={() => setCurrentQuestion(currentQuestion - 1)}
                        disabled={currentQuestion === 0}
                    >
                        <Text style={styles.navButtonText}>Previous</Text>
                    </TouchableOpacity>

                    {currentQuestion < questions.length - 1 ? (
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => setCurrentQuestion(currentQuestion + 1)}
                        >
                            <Text style={styles.navButtonText}>Next</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit Test</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    // COMPLETED STAGE
    if (stage === 'completed') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.completedContainer}>
                    <Text style={styles.completedTitle}>Test Completed! 🎉</Text>
                    <Text style={styles.completedText}>
                        Your responses have been submitted successfully.
                    </Text>
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.homeButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    // Intro Stage
    introContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    introTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    introSubtitle: {
        fontSize: 18,
        color: '#e0e7ff',
        marginBottom: 30,
        textAlign: 'center',
    },
    featureList: {
        marginBottom: 40,
    },
    featureItem: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 10,
    },
    warningText: {
        fontSize: 14,
        color: '#fef3c7',
        marginBottom: 40,
        textAlign: 'center',
    },
    startButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },
    // Reaction Test
    testHeader: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    testTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    roundCounter: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 5,
    },
    reactionZone: {
        flex: 1,
        margin: 20,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fbbf24',
    },
    reactionZoneWaiting: {
        backgroundColor: '#fbbf24',
    },
    reactionZoneReady: {
        backgroundColor: '#10b981',
    },
    reactionText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    scoresContainer: {
        padding: 20,
        backgroundColor: '#fff',
    },
    scoresTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    scoreItem: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 5,
    },
    // Memory Test
    memoryInstruction: {
        fontSize: 18,
        textAlign: 'center',
        padding: 20,
        color: '#374151',
    },
    memoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: 20,
    },
    memoryTile: {
        width: width / 4 - 20,
        height: width / 4 - 20,
        margin: 5,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    memoryTileActive: {
        backgroundColor: '#6366f1',
    },
    memoryTileSelected: {
        backgroundColor: '#10b981',
    },
    memoryTileText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374151',
    },
    // Questions
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    questionCounter: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    timerContainer: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400e',
    },
    integrityBar: {
        backgroundColor: '#dcfce7',
        padding: 10,
        alignItems: 'center',
    },
    integrityText: {
        fontSize: 14,
        color: '#166534',
        fontWeight: '600',
    },
    questionContainer: {
        flex: 1,
        padding: 20,
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 30,
        lineHeight: 28,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        marginBottom: 12,
    },
    optionButtonSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#eef2ff',
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
    },
    optionTextSelected: {
        color: '#6366f1',
        fontWeight: '600',
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    navButton: {
        flex: 1,
        backgroundColor: '#6366f1',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#d1d5db',
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    button: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Completed
    completedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    completedTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    completedText: {
        fontSize: 18,
        color: '#e0e7ff',
        marginBottom: 40,
        textAlign: 'center',
    },
    homeButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
    },
    homeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },
});

export default TestScreen;
