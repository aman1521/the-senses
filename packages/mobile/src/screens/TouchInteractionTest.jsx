import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    PanResponder,
    Animated,
    Vibration,
    Alert,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

/**
 * Interactive Testing Screen for Mobile Touch Interactions
 * Tests: Tap, Long Press, Swipe, Drag & Drop, Multi-touch
 */
const TouchInteractionTest = ({ navigation }) => {
    const [testResults, setTestResults] = useState({
        tap: null,
        longPress: null,
        swipe: null,
        dragDrop: null,
        multiTouch: null,
    });

    const [currentTest, setCurrentTest] = useState('intro');

    // ============ TAP TEST ============
    const [tapCount, setTapCount] = useState(0);
    const [tapTimes, setTapTimes] = useState([]);
    const tapStartTime = useRef(null);

    const handleTap = () => {
        const now = Date.now();
        if (tapStartTime.current) {
            setTapTimes([...tapTimes, now - tapStartTime.current]);
        }
        tapStartTime.current = now;

        const newCount = tapCount + 1;
        setTapCount(newCount);
        Vibration.vibrate(10);

        if (newCount >= 5) {
            const avgTime = tapTimes.reduce((a, b) => a + b, 0) / tapTimes.length;
            setTestResults((prev) => ({
                ...prev,
                tap: { count: newCount, avgTime: avgTime.toFixed(0) },
            }));
            Alert.alert('Tap Test Complete!', `Average tap interval: ${avgTime.toFixed(0)}ms`);
            setCurrentTest('longPress');
        }
    };

    // ============ LONG PRESS TEST ============
    const [longPressTime, setLongPressTime] = useState(null);
    const longPressStart = useRef(null);

    const handleLongPressIn = () => {
        longPressStart.current = Date.now();
    };

    const handleLongPressOut = () => {
        if (longPressStart.current) {
            const duration = Date.now() - longPressStart.current;
            setLongPressTime(duration);

            if (duration >= 1000) {
                Vibration.vibrate(50);
                setTestResults((prev) => ({
                    ...prev,
                    longPress: { duration },
                }));
                Alert.alert('Long Press Test Complete!', `Held for ${duration}ms`);
                setCurrentTest('swipe');
            } else {
                Alert.alert('Too Short', 'Hold for at least 1 second');
            }
        }
    };

    // ============ SWIPE TEST ============
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [swipeDistance, setSwipeDistance] = useState(0);

    const swipePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                setSwipeDistance(Math.abs(gestureState.dx) + Math.abs(gestureState.dy));
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, dy } = gestureState;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 100) {
                    let direction;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        direction = dx > 0 ? 'Right' : 'Left';
                    } else {
                        direction = dy > 0 ? 'Down' : 'Up';
                    }

                    setSwipeDirection(direction);
                    Vibration.vibrate([0, 50, 100, 50]);

                    setTestResults((prev) => ({
                        ...prev,
                        swipe: { direction, distance: distance.toFixed(0) },
                    }));

                    Alert.alert('Swipe Test Complete!', `Swiped ${direction} for ${distance.toFixed(0)}px`);
                    setCurrentTest('dragDrop');
                }
            },
        })
    ).current;

    // ============ DRAG & DROP TEST ============
    const [dragItems, setDragItems] = useState([
        { id: 1, text: 'Item 1', order: 1 },
        { id: 2, text: 'Item 2', order: 2 },
        { id: 3, text: 'Item 3', order: 3 },
    ]);

    const [draggedItem, setDraggedItem] = useState(null);
    const dragPosition = useRef(new Animated.ValueXY()).current;

    const createDragPanResponder = (item) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                setDraggedItem(item);
                Vibration.vibrate(20);
            },
            onPanResponderMove: Animated.event(
                [null, { dx: dragPosition.x, dy: dragPosition.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (evt, gestureState) => {
                const { dy } = gestureState;

                // Simple reordering logic
                if (Math.abs(dy) > 50) {
                    const direction = dy < 0 ? -1 : 1;
                    const newItems = [...dragItems];
                    const currentIndex = newItems.findIndex((i) => i.id === item.id);
                    const newIndex = Math.max(0, Math.min(currentIndex + direction, newItems.length - 1));

                    // Swap items
                    [newItems[currentIndex], newItems[newIndex]] = [
                        newItems[newIndex],
                        newItems[currentIndex],
                    ];

                    setDragItems(newItems);
                    Vibration.vibrate(30);

                    // Check if reordered correctly
                    const isCorrectOrder = newItems.every((item, idx) => item.order === idx + 1);
                    if (!isCorrectOrder) {
                        setTestResults((prev) => ({
                            ...prev,
                            dragDrop: { success: true, reordered: true },
                        }));
                        Alert.alert('Drag & Drop Test Complete!', 'Items successfully reordered');
                        setCurrentTest('multiTouch');
                    }
                }

                Animated.spring(dragPosition, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                }).start();

                setDraggedItem(null);
            },
        });
    };

    // ============ MULTI-TOUCH TEST ============
    const [touchCount, setTouchCount] = useState(0);
    const maxTouches = useRef(0);

    const multiTouchPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const touches = evt.nativeEvent.touches.length;
                setTouchCount(touches);
                maxTouches.current = Math.max(maxTouches.current, touches);

                if (touches >= 2) {
                    Vibration.vibrate([0, 50, 100, 50, 100, 50]);
                    setTestResults((prev) => ({
                        ...prev,
                        multiTouch: { maxTouches: touches },
                    }));
                    Alert.alert('Multi-Touch Test Complete!', `Detected ${touches} simultaneous touches!`);
                    setCurrentTest('complete');
                }
            },
            onPanResponderMove: (evt) => {
                const touches = evt.nativeEvent.touches.length;
                setTouchCount(touches);
                maxTouches.current = Math.max(maxTouches.current, touches);
            },
            onPanResponderRelease: () => {
                setTouchCount(0);
            },
        })
    ).current;

    // ============ RENDER ============
    if (currentTest === 'intro') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.introContainer}>
                    <Text style={styles.introTitle}>Touch Interaction Testing</Text>
                    <Text style={styles.introSubtitle}>
                        This test will verify that all touch interactions work correctly on your device.
                    </Text>
                    <View style={styles.testList}>
                        <Text style={styles.testItem}>✓ Tap Test (5 taps)</Text>
                        <Text style={styles.testItem}>✓ Long Press Test (1 second hold)</Text>
                        <Text style={styles.testItem}>✓ Swipe Test (any direction)</Text>
                        <Text style={styles.testItem}>✓ Drag & Drop Test (reorder items)</Text>
                        <Text style={styles.testItem}>✓ Multi-Touch Test (2+ fingers)</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => {
                            setCurrentTest('tap');
                            tapStartTime.current = Date.now();
                        }}
                    >
                        <Text style={styles.startButtonText}>Start Testing</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    if (currentTest === 'complete') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ScrollView contentContainerStyle={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Test Results ✅</Text>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Tap Test</Text>
                        <Text style={styles.resultText}>
                            {testResults.tap
                                ? `${testResults.tap.count} taps, avg ${testResults.tap.avgTime}ms`
                                : 'Not completed'}
                        </Text>
                    </View>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Long Press Test</Text>
                        <Text style={styles.resultText}>
                            {testResults.longPress
                                ? `Held for ${testResults.longPress.duration}ms`
                                : 'Not completed'}
                        </Text>
                    </View>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Swipe Test</Text>
                        <Text style={styles.resultText}>
                            {testResults.swipe
                                ? `Swiped ${testResults.swipe.direction}, ${testResults.swipe.distance}px`
                                : 'Not completed'}
                        </Text>
                    </View>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Drag & Drop Test</Text>
                        <Text style={styles.resultText}>
                            {testResults.dragDrop ? 'Successfully reordered items' : 'Not completed'}
                        </Text>
                    </View>

                    <View style={styles.resultCard}>
                        <Text style={styles.resultTitle}>Multi-Touch Test</Text>
                        <Text style={styles.resultText}>
                            {testResults.multiTouch
                                ? `Detected ${testResults.multiTouch.maxTouches} touches`
                                : 'Not completed'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Tap Test */}
            {currentTest === 'tap' && (
                <View style={styles.testContainer}>
                    <Text style={styles.testTitle}>Tap Test</Text>
                    <Text style={styles.testInstructions}>Tap the button 5 times as quickly as you can</Text>
                    <TouchableOpacity style={styles.tapZone} onPress={handleTap} activeOpacity={0.7}>
                        <Text style={styles.tapZoneText}>{tapCount} / 5</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Long Press Test */}
            {currentTest === 'longPress' && (
                <View style={styles.testContainer}>
                    <Text style={styles.testTitle}>Long Press Test</Text>
                    <Text style={styles.testInstructions}>Hold the button for at least 1 second</Text>
                    <TouchableOpacity
                        style={styles.longPressZone}
                        onPressIn={handleLongPressIn}
                        onPressOut={handleLongPressOut}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.longPressText}>
                            {longPressTime ? `${longPressTime}ms` : 'Press and Hold'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Swipe Test */}
            {currentTest === 'swipe' && (
                <View style={styles.testContainer}>
                    <Text style={styles.testTitle}>Swipe Test</Text>
                    <Text style={styles.testInstructions}>Swipe in any direction</Text>
                    <View style={styles.swipeZone} {...swipePanResponder.panHandlers}>
                        <Text style={styles.swipeText}>
                            {swipeDirection || 'Swipe Here'}
                            {swipeDistance > 0 && `\n${swipeDistance.toFixed(0)}px`}
                        </Text>
                    </View>
                </View>
            )}

            {/* Drag & Drop Test */}
            {currentTest === 'dragDrop' && (
                <View style={styles.testContainer}>
                    <Text style={styles.testTitle}>Drag & Drop Test</Text>
                    <Text style={styles.testInstructions}>Drag items to reorder them</Text>
                    <View style={styles.dragDropContainer}>
                        {dragItems.map((item) => {
                            const panResponder = createDragPanResponder(item);
                            const isDragging = draggedItem?.id === item.id;

                            return (
                                <Animated.View
                                    key={item.id}
                                    style={[
                                        styles.dragItem,
                                        isDragging && {
                                            transform: dragPosition.getTranslateTransform(),
                                            opacity: 0.8,
                                            elevation: 10,
                                        },
                                    ]}
                                    {...panResponder.panHandlers}
                                >
                                    <Text style={styles.dragItemText}>{item.text}</Text>
                                    <Text style={styles.dragHandle}>☰</Text>
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Multi-Touch Test */}
            {currentTest === 'multiTouch' && (
                <View style={styles.testContainer}>
                    <Text style={styles.testTitle}>Multi-Touch Test</Text>
                    <Text style={styles.testInstructions}>
                        Touch the area with 2 or more fingers simultaneously
                    </Text>
                    <View style={styles.multiTouchZone} {...multiTouchPanResponder.panHandlers}>
                        <Text style={styles.multiTouchText}>
                            {touchCount > 0 ? `${touchCount} touch(es)` : 'Touch with multiple fingers'}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    introContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    introTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    introSubtitle: {
        fontSize: 16,
        color: '#e0e7ff',
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 24,
    },
    testList: {
        marginBottom: 40,
        alignItems: 'flex-start',
    },
    testItem: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 10,
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
    testContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    testTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    testInstructions: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 40,
        textAlign: 'center',
    },
    tapZone: {
        width: width - 80,
        height: 200,
        backgroundColor: '#6366f1',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    tapZoneText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    longPressZone: {
        width: width - 80,
        height: 200,
        backgroundColor: '#10b981',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    longPressText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    swipeZone: {
        width: width - 80,
        height: 300,
        backgroundColor: '#f59e0b',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    swipeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    dragDropContainer: {
        padding: 20,
    },
    dragItem: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    dragItemText: {
        fontSize: 18,
        color: '#111827',
        fontWeight: '600',
    },
    dragHandle: {
        fontSize: 24,
        color: '#9ca3af',
    },
    multiTouchZone: {
        width: width - 80,
        height: 300,
        backgroundColor: '#8b5cf6',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    multiTouchText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    resultsContainer: {
        padding: 30,
    },
    resultsTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
        textAlign: 'center',
    },
    resultCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    resultText: {
        fontSize: 14,
        color: '#6b7280',
    },
    doneButton: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
    },
    doneButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#667eea',
    },
});

export default TouchInteractionTest;
