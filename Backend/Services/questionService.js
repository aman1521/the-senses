// services/questionService.js
// Question Management Service
// Phase 2.5: Dynamic Question System with Caching

const QuestionBank = require("../models/QuestionBank");
const mongoose = require("mongoose");
const { generateQuestionsForProfile } = require("../ai-agents/questions/questionGenerator");
const { getProfileById } = require("../data/jobProfiles");

// In-memory cache for frequently accessed questions
const questionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get questions for a test session
 * - First checks cache
 * - Then checks database
 * - Finally generates new questions if needed
 */
const IntelligenceResult = require("../models/IntelligenceResult");

async function getQuestionsForTest(profileId, difficulty = "medium", count = 30, userId = null) {
    try {
        let excludeIds = [];

        // 1. If User is logged in, fetch their history to prevent repeats
        if (userId) {
            const history = await IntelligenceResult.find({ userId: userId }).select('testDetail.questions.questionId');

            history.forEach(result => {
                if (result.testDetail && result.testDetail.questions) {
                    result.testDetail.questions.forEach(q => {
                        if (q.questionId) excludeIds.push(q.questionId);
                    });
                }
            });
            console.log(`🚫 Excluding ${excludeIds.length} previously answered questions for user ${userId}`);
        }

        // Convert strict string IDs to ObjectIds for correct $nin matching
        const excludeObjectIds = excludeIds
            .filter(id => mongoose.isValidObjectId(id))
            .map(id => new mongoose.Types.ObjectId(id));

        // 2. Check available pool (excluding history)
        const totalAvailable = await QuestionBank.countDocuments({
            profileId,
            difficulty,
            active: true,
            _id: { $nin: excludeObjectIds }
        });

        // 3. If pool is low or insufficient, generate NEW questions
        // INCREASED THRESHOLD: Need at least 50 more than requested to avoid running out
        const minimumBuffer = 50;
        if (totalAvailable < count + minimumBuffer) {
            console.log(`⚠️ Pool low (Available: ${totalAvailable}, Needed: ${count + minimumBuffer}). Generating fresh questions...`);
            const needed = (count + 100) - totalAvailable; // Generate enough to build a good buffer
            await generateAndSaveQuestions(profileId, difficulty, Math.max(30, needed));
        }

        // 4. Fetch random questions (excluding history)
        let questions = await QuestionBank.getRandomQuestions(profileId, difficulty, count, excludeObjectIds);

        // 5. Final Fallback: If we STILL don't have enough (e.g. Generation failed), fetch *any* questions (allow repeats as last resort)
        if (questions.length < count) {
            console.warn("⚠️ Unique questions exhausted. Backfilling with repeats...");
            const filler = await QuestionBank.getRandomQuestions(profileId, difficulty, count - questions.length, []); // empty exclude
            questions = [...questions, ...filler];
        }

        // Update usage count
        if (questions.length > 0) {
            await Promise.all(
                questions.map(q => QuestionBank.findByIdAndUpdate(q._id, {
                    $inc: { usageCount: 1 },
                    lastUsed: new Date()
                }))
            );
        }

        return formatQuestionsForTest(questions);

    } catch (error) {
        console.error("❌ Error getting questions:", error);
        throw error;
    }
}

/**
 * Generate questions and save to database
 */
async function generateAndSaveQuestions(profileId, difficulty, count) {
    try {
        // Generate questions using AI
        const generatedQuestions = await generateQuestionsForProfile(profileId, count, difficulty);

        // Save to database
        const savedQuestions = await QuestionBank.insertMany(generatedQuestions);

        console.log(`✅ Saved ${savedQuestions.length} questions to database`);

        return savedQuestions;

    } catch (error) {
        console.error("❌ Error generating and saving questions:", error);
        throw error;
    }
}

/**
 * Pre-generate questions for all profiles (run as cron job or on demand)
 * INCREASED TARGET: Now aims for 200 questions per profile/difficulty
 */
async function pregenerateQuestionsForAllProfiles() {
    const { JOB_PROFILES } = require("../data/jobProfiles");
    const difficulties = ["easy", "medium", "hard"];
    const TARGET_PER_DIFFICULTY = 200; // Increased from 100

    console.log("🚀 Pre-generating questions for all profiles...");

    const results = {
        success: [],
        failed: [],
    };

    for (const profile of JOB_PROFILES) {
        if (!profile.active) continue;

        for (const difficulty of difficulties) {
            try {
                // Check if we already have enough questions
                const existingCount = await QuestionBank.countDocuments({
                    profileId: profile.id,
                    difficulty,
                    active: true,
                });

                if (existingCount >= TARGET_PER_DIFFICULTY) {
                    console.log(`✅ ${profile.name} (${difficulty}): Already has ${existingCount} questions`);
                    continue;
                }

                // Generate new questions
                const needed = TARGET_PER_DIFFICULTY - existingCount;
                console.log(`🔄 Generating ${needed} ${difficulty} questions for ${profile.name}...`);

                await generateAndSaveQuestions(profile.id, difficulty, needed);

                results.success.push(`${profile.name} (${difficulty})`);

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`❌ Failed for ${profile.name} (${difficulty}):`, error.message);
                results.failed.push(`${profile.name} (${difficulty}): ${error.message}`);
            }
        }
    }

    console.log("\n📊 Pre-generation Results:");
    console.log(`✅ Success: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    return results;
}

/**
 * Get question statistics
 */
async function getQuestionStats(profileId) {
    const stats = await QuestionBank.aggregate([
        { $match: { profileId } },
        {
            $group: {
                _id: "$difficulty",
                count: { $sum: 1 },
                avgUsage: { $avg: "$usageCount" },
                aiGenerated: {
                    $sum: { $cond: ["$aiGenerated", 1, 0] }
                },
                flagged: {
                    $sum: { $cond: ["$flagged", 1, 0] }
                }
            }
        }
    ]);

    return stats;
}

/**
 * Flag a question for review
 */
async function flagQuestion(questionId, reason) {
    return await QuestionBank.findByIdAndUpdate(
        questionId,
        {
            flagged: true,
            flagReason: reason,
        },
        { new: true }
    );
}

/**
 * Get flagged questions for review
 */
async function getFlaggedQuestions() {
    return await QuestionBank.find({ flagged: true })
        .sort({ createdAt: -1 })
        .exec();
}

/**
 * Delete old unused questions (cleanup)
 */
async function cleanupOldQuestions(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await QuestionBank.deleteMany({
        generatedAt: { $lt: cutoffDate },
        usageCount: 0,
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old unused questions`);
    return result;
}

// Cache management
function getFromCache(key) {
    const cached = questionCache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
        questionCache.delete(key);
        return null;
    }

    return cached.data;
}

function setCache(key, data) {
    questionCache.set(key, {
        data,
        timestamp: Date.now(),
    });
}

function clearCache() {
    questionCache.clear();
    console.log("🗑️ Question cache cleared");
}

/**
 * Format questions for test (remove correct answers, etc.)
 */
function formatQuestionsForTest(questions) {
    return questions.map((q, index) => ({
        id: q._id || q.id,
        questionNumber: index + 1,
        question: q.question,
        options: q.options,
        topic: q.topic,
        difficulty: q.difficulty,
        correctAnswer: q.correctAnswer, // Enabled for client-side scoring
    }));
}

module.exports = {
    getQuestionsForTest,
    generateAndSaveQuestions,
    pregenerateQuestionsForAllProfiles,
    getQuestionStats,
    flagQuestion,
    getFlaggedQuestions,
    cleanupOldQuestions,
    clearCache,
};
