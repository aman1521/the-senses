// Services/antiCheatService.js
// PHASE 0: Anti-Cheat Risk Detection (Non-blocking, Scoring Only)
// Purpose: Log integrity signals without penalizing users

/**
 * Calculate cheat risk score for a test submission
 * Returns a score from 0-100 (0 = no risk, 100 = high risk)
 * 
 * @param {Object} testData - Test submission data
 * @returns {Object} Risk analysis with score and signals
 */
function calculateCheatRisk(testData) {
    const {
        answers,
        timeTaken,           // Total time in seconds
        questionTimings = [], // Individual question timings
        questions,
        tabSwitches = 0,     // Number of tab switches (from frontend)
        copyPasteEvents = 0, // Copy/paste events (from frontend)
        devToolsOpen = false // DevTools detection (from frontend)
    } = testData;

    const signals = [];
    let riskScore = 0;

    // 1. TIME ANOMALY DETECTION
    const timeRisk = detectTimeAnomalies(timeTaken, questions.length, questionTimings);
    if (timeRisk.risk > 0) {
        riskScore += timeRisk.risk;
        signals.push(...timeRisk.signals);
    }

    // 2. PATTERN DETECTION
    const patternRisk = detectAnswerPatterns(answers);
    if (patternRisk.risk > 0) {
        riskScore += patternRisk.risk;
        signals.push(...patternRisk.signals);
    }

    // 3. CONSISTENCY CHECKS
    const consistencyRisk = detectInconsistencies(questions, answers, questionTimings);
    if (consistencyRisk.risk > 0) {
        riskScore += consistencyRisk.risk;
        signals.push(...consistencyRisk.signals);
    }

    // 4. BROWSER BEHAVIOR SIGNALS
    const browserRisk = detectBrowserAnomalies(tabSwitches, copyPasteEvents, devToolsOpen);
    if (browserRisk.risk > 0) {
        riskScore += browserRisk.risk;
        signals.push(...browserRisk.signals);
    }

    // Normalize score to 0-100
    riskScore = Math.min(100, Math.max(0, riskScore));

    return {
        riskScore: Math.round(riskScore),
        riskLevel: getRiskLevel(riskScore),
        signals: signals,
        timestamp: new Date()
    };
}

/**
 * Detect timing anomalies
 */
function detectTimeAnomalies(totalTime, questionCount, timings) {
    const signals = [];
    let risk = 0;

    const avgTimePerQuestion = totalTime / questionCount;
    const expectedAvgTime = 30; // 30 seconds per question is reasonable

    // Too fast (superhuman speed)
    if (avgTimePerQuestion < 5) {
        risk += 30;
        signals.push({
            type: 'TIME_TOO_FAST',
            severity: 'high',
            message: `Average ${avgTimePerQuestion.toFixed(1)}s per question (expected ~30s)`
        });
    } else if (avgTimePerQuestion < 10) {
        risk += 15;
        signals.push({
            type: 'TIME_SUSPICIOUSLY_FAST',
            severity: 'medium',
            message: `Average ${avgTimePerQuestion.toFixed(1)}s per question`
        });
    }

    // Too slow (possible research during test)
    if (avgTimePerQuestion > 180) { // 3 minutes per question
        risk += 10;
        signals.push({
            type: 'TIME_TOO_SLOW',
            severity: 'low',
            message: `Average ${avgTimePerQuestion.toFixed(1)}s per question (unusually slow)`
        });
    }

    // Check individual question timings for impossible speeds
    if (timings && timings.length > 0) {
        const tooFastCount = timings.filter(t => t < 2).length;
        if (tooFastCount > 3) {
            risk += 20;
            signals.push({
                type: 'MULTIPLE_INSTANT_ANSWERS',
                severity: 'high',
                message: `${tooFastCount} questions answered in <2 seconds`
            });
        }
    }

    return { risk, signals };
}

/**
 * Detect suspicious answer patterns
 */
function detectAnswerPatterns(answers) {
    const signals = [];
    let risk = 0;

    if (!answers || answers.length < 5) return { risk: 0, signals: [] };

    // Pattern 1: All same answer (e.g., all A, all 0)
    const answerCounts = answers.reduce((acc, ans) => {
        acc[ans] = (acc[ans] || 0) + 1;
        return acc;
    }, {});

    const maxSameAnswer = Math.max(...Object.values(answerCounts));
    const sameAnswerPercentage = (maxSameAnswer / answers.length) * 100;

    if (sameAnswerPercentage > 80) {
        risk += 25;
        signals.push({
            type: 'IDENTICAL_ANSWERS',
            severity: 'high',
            message: `${sameAnswerPercentage.toFixed(0)}% answers are identical`
        });
    } else if (sameAnswerPercentage > 60) {
        risk += 10;
        signals.push({
            type: 'HIGH_ANSWER_REPETITION',
            severity: 'medium',
            message: `${sameAnswerPercentage.toFixed(0)}% answers are the same option`
        });
    }

    // Pattern 2: Alternating pattern (e.g., 0,1,0,1,0,1)
    let alternatingCount = 0;
    for (let i = 2; i < answers.length; i++) {
        if (answers[i] === answers[i - 2] && answers[i] !== answers[i - 1]) {
            alternatingCount++;
        }
    }
    const alternatingPercentage = (alternatingCount / (answers.length - 2)) * 100;

    if (alternatingPercentage > 70) {
        risk += 20;
        signals.push({
            type: 'ALTERNATING_PATTERN',
            severity: 'high',
            message: `${alternatingPercentage.toFixed(0)}% answers follow alternating pattern`
        });
    }

    // Pattern 3: Sequential pattern (e.g., 0,1,2,3,0,1,2,3)
    let sequentialCount = 0;
    for (let i = 1; i < answers.length; i++) {
        if (answers[i] === (answers[i - 1] + 1) % 4) {
            sequentialCount++;
        }
    }
    const sequentialPercentage = (sequentialCount / (answers.length - 1)) * 100;

    if (sequentialPercentage > 60) {
        risk += 15;
        signals.push({
            type: 'SEQUENTIAL_PATTERN',
            severity: 'medium',
            message: `${sequentialPercentage.toFixed(0)}% answers follow sequential pattern`
        });
    }

    return { risk, signals };
}

/**
 * Detect inconsistencies between performance and timing
 */
function detectInconsistencies(questions, answers, timings) {
    const signals = [];
    let risk = 0;

    if (!questions || !answers || questions.length === 0) {
        return { risk: 0, signals: [] };
    }

    // Calculate correctness
    const correct = questions.filter((q, i) => q.correctAnswer === answers[i]).length;
    const accuracy = (correct / questions.length) * 100;

    // Check difficulty vs accuracy vs time
    const hardQuestions = questions.filter(q => q.difficulty === 'hard').length;
    const hasHardQuestions = hardQuestions > questions.length * 0.3;

    const avgTime = timings && timings.length > 0
        ? timings.reduce((sum, t) => sum + t, 0) / timings.length
        : 0;

    // Impossible accuracy with hard questions and fast timing
    if (hasHardQuestions && accuracy > 90 && avgTime < 10) {
        risk += 30;
        signals.push({
            type: 'IMPOSSIBLE_PERFORMANCE',
            severity: 'high',
            message: `${accuracy.toFixed(0)}% accuracy on hard questions with ${avgTime.toFixed(1)}s avg time`
        });
    }

    // Perfect score with minimal time
    if (accuracy === 100 && avgTime < 8) {
        risk += 25;
        signals.push({
            type: 'PERFECT_SCORE_TOO_FAST',
            severity: 'high',
            message: `100% accuracy with ${avgTime.toFixed(1)}s per question`
        });
    }

    return { risk, signals };
}

/**
 * Detect browser behavior anomalies
 */
function detectBrowserAnomalies(tabSwitches, copyPasteEvents, devToolsOpen) {
    const signals = [];
    let risk = 0;

    // Tab switching (possible research)
    if (tabSwitches > 10) {
        risk += 20;
        signals.push({
            type: 'EXCESSIVE_TAB_SWITCHING',
            severity: 'medium',
            message: `${tabSwitches} tab switches during test`
        });
    } else if (tabSwitches > 5) {
        risk += 10;
        signals.push({
            type: 'MODERATE_TAB_SWITCHING',
            severity: 'low',
            message: `${tabSwitches} tab switches detected`
        });
    }

    // Copy/paste (possible external answer copying)
    if (copyPasteEvents > 5) {
        risk += 15;
        signals.push({
            type: 'MULTIPLE_COPY_PASTE',
            severity: 'medium',
            message: `${copyPasteEvents} copy/paste events detected`
        });
    }

    // DevTools open (possible code inspection)
    if (devToolsOpen) {
        risk += 10;
        signals.push({
            type: 'DEVTOOLS_OPEN',
            severity: 'low',
            message: 'Browser DevTools detected as open'
        });
    }

    return { risk, signals };
}

/**
 * Convert risk score to risk level
 */
function getRiskLevel(score) {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 15) return 'LOW';
    return 'NONE';
}

module.exports = {
    calculateCheatRisk,
    getRiskLevel
};
