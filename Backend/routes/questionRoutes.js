// routes/questionRoutes.js
// Question Management API Routes
// Phase 2.5: AI Question Generation System

const express = require("express");
const router = express.Router();
const {
    getQuestionsForTest,
    pregenerateQuestionsForAllProfiles,
    getQuestionStats,
    flagQuestion,
    getFlaggedQuestions,
    clearCache,
} = require("../Services/questionService"); // Casing fixed for Linux compatibility
const { JOB_PROFILES, getAllActiveProfiles } = require("../Data/jobProfiles");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// GET /api/questions/profiles - Get all available job profiles
router.get("/profiles", (req, res, next) => {
    try {
        const profiles = getAllActiveProfiles();

        // Return simplified profile data for frontend
        const profileList = profiles.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            icon: p.icon,
            color: p.color,
            skills: p.skills,
        }));

        return successResponse(res, { profiles: profileList });
    } catch (error) {
        next(error);
    }
});

const { auth } = require("../middleware/auth");

// POST /api/questions/generate - Get questions for a test
router.post("/generate", auth(false), async (req, res, next) => {
    try {
        const { profileId, difficulty = "medium", count = 30 } = req.body;

        if (!profileId) {
            return errorResponse(res, "Profile ID is required", 400);
        }

        console.log(`📝 Generating ${count} ${difficulty} questions for profile: ${profileId}`);

        const questions = await getQuestionsForTest(profileId, difficulty, count, req.user?._id);

        return successResponse(res, {
            questions,
            meta: {
                profileId,
                difficulty,
                count: questions.length,
            }
        });

    } catch (error) {
        console.error("Question generation error:", error);
        next(error);
    }
});

// POST /api/questions/pregenerate - Pre-generate questions for all profiles (Admin only)
router.post("/pregenerate", async (req, res, next) => {
    try {
        // TODO: Add admin authentication middleware

        console.log("🚀 Starting pre-generation for all profiles...");

        const results = await pregenerateQuestionsForAllProfiles();

        return successResponse(res, results, "Pre-generation complete");

    } catch (error) {
        console.error("Pre-generation error:", error);
        next(error);
    }
});

// GET /api/questions/stats/:profileId - Get question statistics for a profile
router.get("/stats/:profileId", async (req, res, next) => {
    try {
        const { profileId } = req.params;

        const stats = await getQuestionStats(profileId);

        return successResponse(res, {
            profileId,
            stats,
        });

    } catch (error) {
        next(error);
    }
});

// POST /api/questions/flag - Flag a question for review
router.post("/flag", async (req, res, next) => {
    try {
        const { questionId, reason } = req.body;

        if (!questionId || !reason) {
            return errorResponse(res, "Question ID and reason are required", 400);
        }

        const flagged = await flagQuestion(questionId, reason);

        return successResponse(res, { question: flagged }, "Question flagged for review");

    } catch (error) {
        next(error);
    }
});

// GET /api/questions/flagged - Get all flagged questions (Admin only)
router.get("/flagged", async (req, res, next) => {
    try {
        // TODO: Add admin authentication middleware

        const flagged = await getFlaggedQuestions();

        return successResponse(res, {
            count: flagged.length,
            questions: flagged,
        });

    } catch (error) {
        next(error);
    }
});

// POST /api/questions/cache/clear - Clear question cache (Admin only)
router.post("/cache/clear", (req, res, next) => {
    try {
        // TODO: Add admin authentication middleware

        clearCache();

        return successResponse(res, null, "Question cache cleared");

    } catch (error) {
        next(error);
    }
});

module.exports = router;
