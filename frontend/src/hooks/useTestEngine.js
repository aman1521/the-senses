/**
 * useTestEngine Hook
 * 
 * Manages the state and logic for the assessment engine using the core testMachine.
 * Provides a clean API for the UI to interact with.
 */
import { useReducer, useEffect, useCallback, useRef } from 'react';
import { testMachine } from '../lib/core';

const { testReducer, initialState, ACTIONS } = testMachine;

export const useTestEngine = () => {
    const [state, dispatch] = useReducer(testReducer, initialState);
    const timerRef = useRef(null);

    // Timer Logic
    useEffect(() => {
        if (state.status === 'running') {
            timerRef.current = setInterval(() => {
                dispatch({ type: ACTIONS.TICK_TIMER });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [state.status]);

    // Dispatch Wrappers
    const startTest = useCallback((duration = 1800) => {
        dispatch({ type: ACTIONS.START_TEST, payload: { duration } });
    }, []);

    const setQuestions = useCallback((questions) => {
        dispatch({ type: ACTIONS.SET_QUESTIONS, payload: questions });
    }, []);

    const answerQuestion = useCallback((questionId, answer) => {
        dispatch({ type: ACTIONS.ANSWER_QUESTION, payload: { questionId, answer } });
    }, []);

    const nextQuestion = useCallback(() => {
        dispatch({ type: ACTIONS.NEXT_QUESTION });
    }, []);

    const prevQuestion = useCallback(() => {
        dispatch({ type: ACTIONS.PREV_QUESTION });
    }, []);

    const changeStep = useCallback((step) => {
        dispatch({ type: ACTIONS.CHANGE_STEP, payload: step });
    }, []);

    const flagIntegrity = useCallback((reason, penalty = 0, isTabSwitch = false) => {
        dispatch({ type: ACTIONS.FLAG_INTEGRITY, payload: { reason, penalty, isTabSwitch } });
    }, []);

    const recordReaction = useCallback((time) => {
        dispatch({ type: ACTIONS.RECORD_REACTION, payload: time });
    }, []);

    const setMemoryScore = useCallback((score) => {
        dispatch({ type: ACTIONS.SET_MEMORY_SCORE, payload: score });
    }, []);

    const setVisionScore = useCallback((score) => {
        dispatch({ type: ACTIONS.SET_VISION_SCORE, payload: score });
    }, []);

    const setReflexMetrics = useCallback((metrics) => {
        dispatch({ type: ACTIONS.SET_REFLEX_METRICS, payload: metrics });
    }, []);

    const completeTest = useCallback(() => {
        dispatch({ type: ACTIONS.COMPLETE_TEST });
    }, []);

    return {
        state,
        actions: {
            startTest,
            setQuestions,
            answerQuestion,
            nextQuestion,
            prevQuestion,
            changeStep,
            flagIntegrity,
            recordReaction,
            setMemoryScore,
            setVisionScore,
            setReflexMetrics,
            completeTest
        }
    };
};
