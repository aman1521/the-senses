import { useState, useEffect, useRef, useCallback } from 'react';
import { API } from '../services/api';

/**
 * Hook to track user activity telemetry during a test session
 * @param {string} sessionId - The current session ID
 * @param {boolean} isActive - Whether tracking should be active
 */
export const useTelemetry = (sessionId, isActive) => {
    const [events, setEvents] = useState([]);
    const eventsRef = useRef([]); // Ref to keep track without re-renders dependency issues
    const batchIdRef = useRef(Date.now().toString());
    const lastDims = useRef({ // DevTools Detection
        w: window.outerWidth,
        h: window.outerHeight,
        innerW: window.innerWidth,
        innerH: window.innerHeight
    });

    // --- Event Logger ---
    const logEvent = useCallback((type, metadata = {}) => {
        if (!isActive || !sessionId) return;

        const event = {
            eventType: type,
            timestamp: new Date(),
            metadata
        };
        eventsRef.current.push(event);
        setEvents(prev => [...prev, event]);
    }, [isActive, sessionId]);

    // --- Event Listeners ---
    useEffect(() => {
        if (!isActive || !sessionId) return;

        // 1. Visibility Change (Tab Switch/Minimize)
        const handleVisibilityChange = () => {
            logEvent('visibility_change', { visible: !document.hidden });
            if (document.hidden) {
                logEvent('tab_switch', { type: 'leave' });
            } else {
                logEvent('tab_switch', { type: 'return' });
            }
        };

        // 2. Window Blur (Focus Loss)
        const handleBlur = () => logEvent('window_blur');
        const handleFocus = () => logEvent('window_focus');

        // 3. Copy/Paste
        const handleCopy = () => logEvent('copy_event');
        const handlePaste = (e) => {
            logEvent('paste_event', { length: e.clipboardData?.getData('text')?.length || 0 });
        };

        window.document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('copy', handleCopy);
        window.addEventListener('paste', handlePaste);

        return () => {
            window.document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('copy', handleCopy);
            window.removeEventListener('paste', handlePaste);
        };
    }, [isActive, sessionId, logEvent]);

    // --- Idle Detection ---
    useEffect(() => {
        if (!isActive) return;

        let idleTimer;
        let isIdle = false;

        const resetIdle = () => {
            if (isIdle) {
                isIdle = false;
                logEvent('idle_end', { duration: Date.now() - (idleTimer?._idleStart || 0) });
            }
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                isIdle = true;
                idleTimer._idleStart = Date.now();
                logEvent('idle_start');
            }, 10000); // 10 seconds of inactivity
        };

        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('keydown', resetIdle);
        window.addEventListener('scroll', resetIdle);
        window.addEventListener('click', resetIdle);

        resetIdle(); // Start timer

        return () => {
            clearTimeout(idleTimer);
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('keydown', resetIdle);
            window.removeEventListener('scroll', resetIdle);
            window.removeEventListener('click', resetIdle);
        };
    }, [isActive]);



    useEffect(() => {
        if (!isActive) return;

        const checkDevTools = () => {
            const { outerWidth, outerHeight, innerWidth, innerHeight } = window;
            const prev = lastDims.current;

            // Check if outer window size is stable but inner content area shrank significantly
            // This usually happens when a developer panel is docked (Console/Elements)
            const outerStable = Math.abs(outerWidth - prev.w) < 50 && Math.abs(outerHeight - prev.h) < 50;
            const innerShrank = (prev.innerW - innerWidth > 150) || (prev.innerH - innerHeight > 150);

            if (outerStable && innerShrank) {
                logEvent('devtools_detected', {
                    type: 'docked_panel_opened',
                    widthDiff: prev.innerW - innerWidth,
                    heightDiff: prev.innerH - innerHeight
                });
            }

            // Update refs
            lastDims.current = {
                w: outerWidth, h: outerHeight,
                innerW: innerWidth, innerH: innerHeight
            };
        };

        window.addEventListener('resize', checkDevTools);
        return () => window.removeEventListener('resize', checkDevTools);
    }, [isActive, logEvent]);

    // --- Batch Upload ---
    useEffect(() => {
        if (!isActive || !sessionId) return;

        const interval = setInterval(async () => {
            if (eventsRef.current.length === 0) return;

            const batch = [...eventsRef.current];
            eventsRef.current = []; // Clear queue immediately

            try {
                await API.post('/api/v1/session/telemetry', {
                    sessionId,
                    events: batch,
                    metadata: { batchId: batchIdRef.current }
                });
            } catch (err) {
                console.error("Telemetry upload failed:", err);
            }

        }, 5000); // 5 seconds batch

        return () => clearInterval(interval);
    }, [isActive, sessionId]);

    return {
        events,
        logEvent // Exposed for manual logging (e.g. answer_submit)
    };
};
