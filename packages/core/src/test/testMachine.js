/**
 * Test State Machine (Platform Agnostic)
 * Manages the flow of an assessment session.
 */

// Initial State
const initialState = {
    status: 'idle', // idle, running, paused, completed
    currentStep: 'intro', // intro, skill, reflex, memory, psych, result

    // Assessment Data
    questions: [],
    currentIndex: 0,
    answers: {}, // map of questionId -> answer

    // Timing
    startTime: null,
    timeRemaining: 0,

    // Integrity
    integrityScore: 100,
    flags: [],

    // Metrics
    reactionTimes: [],
    memoryScore: 0,
    tabSwitches: 0,
    reflexMetrics: null // Added for detailed reflex test data
};

// Action Types
const ACTIONS = {
    START_TEST: 'START_TEST',
    SET_QUESTIONS: 'SET_QUESTIONS',
    ANSWER_QUESTION: 'ANSWER_QUESTION',
    NEXT_QUESTION: 'NEXT_QUESTION',
    PREV_QUESTION: 'PREV_QUESTION',
    CHANGE_STEP: 'CHANGE_STEP',
    TICK_TIMER: 'TICK_TIMER',
    FLAG_INTEGRITY: 'FLAG_INTEGRITY',
    RECORD_REACTION: 'RECORD_REACTION',
    SET_MEMORY_SCORE: 'SET_MEMORY_SCORE',
    SET_REFLEX_METRICS: 'SET_REFLEX_METRICS', // New Action
    COMPLETE_TEST: 'COMPLETE_TEST'
};

/**
 * Pure Reducer Function
 */
function testReducer(state, action) {
    switch (action.type) {
        case ACTIONS.START_TEST:
            return {
                ...state,
                status: 'running',
                startTime: Date.now(),
                timeRemaining: action.payload.duration || 1800, // Default 30 mins
                currentStep: 'skill'
            };

        case ACTIONS.SET_QUESTIONS:
            return {
                ...state,
                questions: action.payload
            };

        case ACTIONS.ANSWER_QUESTION:
            return {
                ...state,
                answers: {
                    ...state.answers,
                    [action.payload.questionId]: action.payload.answer
                }
            };

        case ACTIONS.NEXT_QUESTION:
            const nextIndex = state.currentIndex + 1;
            if (nextIndex >= state.questions.length) {
                // If end of questions for this section
                return {
                    ...state,
                    currentIndex: 0 // Reset for next section or handle completion
                };
            }
            return {
                ...state,
                currentIndex: nextIndex
            };

        case ACTIONS.PREV_QUESTION:
            return {
                ...state,
                currentIndex: Math.max(0, state.currentIndex - 1)
            };

        case ACTIONS.CHANGE_STEP:
            return {
                ...state,
                currentStep: action.payload,
                currentIndex: 0 // Reset question index for new section
            };

        case ACTIONS.TICK_TIMER:
            if (state.status !== 'running') return state;
            return {
                ...state,
                timeRemaining: Math.max(0, state.timeRemaining - 1)
            };

        case ACTIONS.FLAG_INTEGRITY:
            return {
                ...state,
                integrityScore: Math.max(0, state.integrityScore - (action.payload.penalty || 0)),
                flags: [...state.flags, action.payload.reason],
                tabSwitches: action.payload.isTabSwitch ? state.tabSwitches + 1 : state.tabSwitches
            };

        case ACTIONS.RECORD_REACTION:
            return {
                ...state,
                reactionTimes: [...state.reactionTimes, action.payload]
            };

        case ACTIONS.SET_MEMORY_SCORE:
            return {
                ...state,
                memoryScore: action.payload
            };

        case ACTIONS.SET_REFLEX_METRICS: // Handle new action
            return {
                ...state,
                reflexMetrics: action.payload
            };

        case ACTIONS.COMPLETE_TEST:
            return {
                ...state,
                status: 'completed'
            };

        default:
            return state;
    }
}

module.exports = {
    testReducer,
    initialState,
    ACTIONS
};
