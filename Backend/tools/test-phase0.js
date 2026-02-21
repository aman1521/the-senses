const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { calculateCheatRisk } = require('../Services/antiCheatService');
const IntegrityEvent = require('../models/IntegrityEvent');
const User = require('../models/User');

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. TEST ANTI-CHEAT SERVICE LOCAL LOGIC
        console.log("\n🧪 Testing Anti-Cheat Service Logic...");

        const suspiciousData = {
            answers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // All 'A'
            timeTaken: 5, // 5 seconds for 10 questions (SUPER FAST)
            questions: Array(10).fill({ correctAnswer: 0, difficulty: 'hard' }),
            questionTimings: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
            tabSwitches: 12,
            devToolsOpen: true
        };

        const analysis = calculateCheatRisk(suspiciousData);
        console.log("Risk Score:", analysis.riskScore);
        console.log("Risk Level:", analysis.riskLevel);
        console.log("Signals:", analysis.signals.map(s => s.type));

        if (analysis.riskScore > 80 && analysis.signals.includes('TIME_TOO_FAST')) {
            console.log("✅ Anti-Cheat Logic: DETECTED SUSPICIOUS BEHAVIOR");
        } else {
            console.error("❌ Anti-Cheat Logic: FAILED to detect obvious cheating");
        }

        // 2. TEST DATABASE INTEGRATION (IntegrityEvent)
        console.log("\n🧪 Testing Integrity Event Logging...");

        // Find or create a temp user
        let user = await User.findOne({ email: 'test_cheater@example.com' });
        if (!user) {
            user = await User.create({
                name: 'Test Cheater',
                email: 'test_cheater@example.com',
                password: 'password123',
                role: 'user'
            });
        }

        const event = await IntegrityEvent.create({
            sessionId: 'test-session-' + Date.now(),
            userId: user._id,
            stage: 'skill',
            eventType: 'RISK_ASSESSMENT',
            severity: analysis.riskLevel.toLowerCase(),
            details: JSON.stringify(analysis),
            timestamp: new Date()
        });

        if (event._id) {
            console.log("✅ IntegrityEvent: Successfully saved to DB");
        } else {
            console.error("❌ IntegrityEvent: Failed to save");
        }

        // 3. VERIFY QUESTION REPETITION LOGIC (Mock)
        // detailed testing requires mocking question history which is complex in this script,
        // but we can verify the service imports and function existence.
        const questionService = require('../Services/questionService');
        if (questionService.getQuestionsForTest) {
            console.log("✅ QuestionService: Loaded successfully with getQuestionsForTest");
        }

        console.log("\n🎉 PHASE 0 VALIDATION COMPLETE");

    } catch (err) {
        console.error("❌ Test Failed:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runTest();
