const User = require('../models/User');
const IntelligenceResult = require('../models/IntelligenceResult');

/**
 * Calculate global thinking score based on recent tests
 * @param {ObjectId} userId - User ID
 * @returns {Number} - Calculated global thinking score
 */
async function calculateGlobalThinkingScore(userId) {
    // Get recent tests (last 10 tests weighted more heavily)
    const recentTests = await IntelligenceResult.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('finalScore integrityReport createdAt');

    if (recentTests.length === 0) {
        return 0;
    }

    // Weight recent tests more heavily
    let weightedSum = 0;
    let totalWeight = 0;

    recentTests.forEach((test, index) => {
        // More recent tests get higher weight
        const weight = 1 / (index + 1);

        // Factor in integrity score
        const integrityScore = test.integrityReport?.overallTrustScore || 80;
        const integrityMultiplier = integrityScore / 100;

        weightedSum += test.finalScore * weight * integrityMultiplier;
        totalWeight += weight;
    });

    return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate thinking metrics for radar chart
 * @param {ObjectId} userId - User ID
 * @returns {Object} - Radar chart data
 */
async function calculateThinkingMetrics(userId) {
    const tests = await IntelligenceResult.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    if (tests.length === 0) {
        return {
            problemSolvingSpeed: 0,
            analyticalDepth: 0,
            creativityIndex: 0,
            logicalReasoning: 0,
            criticalThinking: 0,
            patternRecognition: 0,
        };
    }

    // Calculate based on test performance
    const avgData = {
        problemSolvingSpeed: 0,
        analyticalDepth: 0,
        creativityIndex: 0,
        logicalReasoning: 0,
        criticalThinking: 0,
        patternRecognition: 0,
    };

    tests.forEach((test) => {
        // Speed: Based on avg time per question
        const avgTimePerQuestion = test.duration / (test.questions?.length || 1);
        const speedScore = Math.max(0, 100 - avgTimePerQuestion / 2); // Lower time = higher score

        // Analytical depth: Based on score for harder questions
        const analyticalScore = (test.finalScore / 10); // Normalize to 100

        // Creativity: Based on variance in answer patterns (placeholder)
        const creativityScore = test.finalScore / 10;

        // Logical: Based on consistency
        const logicalScore = test.integrityReport?.consistencyScore || test.finalScore / 10;

        // Critical thinking: Based on overall score
        const criticalScore = test.finalScore / 10;

        // Pattern recognition: Based on sequence question performance
        const patternScore = test.finalScore / 10;

        avgData.problemSolvingSpeed += speedScore;
        avgData.analyticalDepth += analyticalScore;
        avgData.creativityIndex += creativityScore;
        avgData.logicalReasoning += logicalScore;
        avgData.criticalThinking += criticalScore;
        avgData.patternRecognition += patternScore;
    });

    // Average it out
    const count = tests.length;
    return {
        problemSolvingSpeed: Math.min(100, Math.round(avgData.problemSolvingSpeed / count)),
        analyticalDepth: Math.min(100, Math.round(avgData.analyticalDepth / count)),
        creativityIndex: Math.min(100, Math.round(avgData.creativityIndex / count)),
        logicalReasoning: Math.min(100, Math.round(avgData.logicalReasoning / count)),
        criticalThinking: Math.min(100, Math.round(avgData.criticalThinking / count)),
        patternRecognition: Math.min(100, Math.round(avgData.patternRecognition / count)),
    };
}

/**
 * Update user's thinking metrics and score
 * @param {ObjectId} userId - User ID
 */
async function updateUserMetrics(userId) {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Calculate global thinking score
    const globalScore = await calculateGlobalThinkingScore(userId);

    // Calculate thinking metrics
    const metrics = await calculateThinkingMetrics(userId);

    // Update overall cognitive score (same as global for now)
    const overallCognitiveScore = globalScore;

    // Get test count
    const testCount = await IntelligenceResult.countDocuments({ user: userId });

    // Update user document
    user.globalThinkingScore = globalScore;
    user.thinkingMetrics.overallCognitiveScore = overallCognitiveScore;
    user.thinkingMetrics.strengthRadarData = metrics;
    user.activity.testsCompleted = testCount;
    user.activity.lastActive = new Date();

    // Update score progression
    const recentTest = await IntelligenceResult.findOne({ user: userId }).sort({ createdAt: -1 });
    if (recentTest) {
        const progressionEntry = {
            testId: recentTest._id,
            score: recentTest.finalScore,
            date: recentTest.createdAt,
            difficulty: recentTest.difficulty,
            antiCheatVerified: recentTest.integrityReport?.overallTrustScore >= 80,
        };

        // Add or update latest entry
        const existingIndex = user.scoreProgression.findIndex(
            (entry) => entry.testId.toString() === recentTest._id.toString()
        );

        if (existingIndex === -1) {
            user.scoreProgression.push(progressionEntry);
        }
    }

    await user.save();

    return user;
}

/**
 * Recalculate global rankings for all users
 */
async function recalculateGlobalRankings() {
    console.log('Starting global rankings recalculation...');

    // Get all users sorted by thinking score
    const users = await User.find({ globalThinkingScore: { $gt: 0 } })
        .sort({ globalThinkingScore: -1, createdAt: 1 })
        .select('_id globalThinkingScore');

    const totalUsers = users.length;

    // Update ranks
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const rank = i + 1;
        const percentile = Math.round(((totalUsers - rank) / totalUsers) * 100);

        await User.findByIdAndUpdate(user._id, {
            globalRank: rank,
            globalRankPercentile: percentile,
        });

        // Check for rank milestones
        await checkRankMilestones(user._id, rank);
    }

    console.log(`✅ Global rankings updated for ${totalUsers} users`);
}

/**
 * Check and award rank milestones
 * @param {ObjectId} userId - User ID
 * @param {Number} rank - Current rank
 */
async function checkRankMilestones(userId, rank) {
    const user = await User.findById(userId).select('achievements');

    const milestones = [
        { rank: 10000, title: 'Top 10,000' },
        { rank: 5000, title: 'Top 5,000' },
        { rank: 1000, title: 'Top 1,000' },
        { rank: 500, title: 'Elite 500' },
        { rank: 100, title: 'Top 100' },
        { rank: 50, title: 'Elite 50' },
        { rank: 10, title: 'Top 10' },
    ];

    for (const milestone of milestones) {
        if (rank <= milestone.rank) {
            // Check if milestone already achieved
            const existing = user.achievements.rankMilestones.find((m) => m.rank === milestone.rank);

            if (!existing) {
                user.achievements.rankMilestones.push({
                    rank: milestone.rank,
                    achievedAt: new Date(),
                    title: milestone.title,
                });
            }
        }
    }

    await user.save();
}

/**
 * Award achievement badge
 * @param {ObjectId} userId - User ID
 * @param {String} badgeId - Badge identifier
 * @param {String} name - Badge name
 * @param {String} description - Badge description
 * @param {String} icon - Badge icon (emoji or URL)
 */
async function awardBadge(userId, badgeId, name, description, icon) {
    const user = await User.findById(userId).select('achievements');

    // Check if badge already earned
    const existing = user.achievements.badges.find((b) => b.badgeId === badgeId);

    if (!existing) {
        user.achievements.badges.push({
            badgeId,
            name,
            description,
            icon,
            earnedAt: new Date(),
        });

        await user.save();

        console.log(`🏆 Badge "${name}" awarded to user ${userId}`);
    }
}

/**
 * Check and award automated badges based on activity
 * @param {ObjectId} userId - User ID
 */
async function checkAutomatedBadges(userId) {
    const user = await User.findById(userId);
    const testCount = await IntelligenceResult.countDocuments({ user: userId });

    // First test badge
    if (testCount === 1) {
        await awardBadge(
            userId,
            'first-test',
            'First Steps',
            'Completed your first cognitive test',
            '🎯'
        );
    }

    // 10 tests badge
    if (testCount === 10) {
        await awardBadge(
            userId,
            'veteran-tester',
            'Veteran Tester',
            'Completed 10 cognitive tests',
            '⭐'
        );
    }

    // High score badge
    if (user.globalThinkingScore >= 800) {
        await awardBadge(
            userId,
            'high-achiever',
            'High Achiever',
            'Achieved thinking score above 800',
            '🏆'
        );
    }

    // Perfect integrity badge
    const perfectIntegrityTests = await IntelligenceResult.countDocuments({
        user: userId,
        'integrityReport.overallTrustScore': { $gte: 95 },
    });

    if (perfectIntegrityTests >= 5) {
        await awardBadge(
            userId,
            'verified-thinker',
            'Verified Thinker',
            'Consistently high integrity scores',
            '✅'
        );
    }
}

module.exports = {
    calculateGlobalThinkingScore,
    calculateThinkingMetrics,
    updateUserMetrics,
    recalculateGlobalRankings,
    checkRankMilestones,
    awardBadge,
    checkAutomatedBadges,
};
