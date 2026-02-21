// middleware/retakeCooldown.js
// Phase 2: Retake Cooldown System
// Prevents spam retakes and increases perceived value

const User = require("../models/User");

// Cooldown period in hours (24 hours = 86400000 ms)
const COOLDOWN_HOURS = 24;
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;

/**
 * Middleware to check if user can retake the test
 * Returns cooldown info if user must wait
 */
async function checkRetakeCooldown(req, res, next) {
    try {
        const userId = req.body.userId || (req.user && req.user._id);

        if (!userId) {
            // No user ID, allow test (first time or guest)
            return next();
        }

        // Fetch user's last test date
        const user = await User.findById(userId).select('lastTestDate history');

        if (!user || !user.lastTestDate) {
            // No previous test, allow
            return next();
        }

        const now = new Date();
        const lastTest = new Date(user.lastTestDate);
        const timeSinceLastTest = now - lastTest;

        // Check if cooldown period has passed
        if (timeSinceLastTest < COOLDOWN_MS) {
            const remainingMs = COOLDOWN_MS - timeSinceLastTest;
            const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
            const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

            // Calculate last vs current comparison (if history exists)
            let lastAttempt = null;
            if (user.history && user.history.length > 0) {
                const previousScores = user.history.slice(-2); // Last 2 attempts
                if (previousScores.length >= 1) {
                    lastAttempt = {
                        score: previousScores[previousScores.length - 1].score,
                        date: previousScores[previousScores.length - 1].date,
                    };
                }
            }

            return res.status(429).json({
                success: false,
                error: "RETAKE_COOLDOWN_ACTIVE",
                message: `You can retake the test in ${remainingHours} hours`,
                cooldown: {
                    active: true,
                    remainingMs,
                    remainingHours,
                    remainingMinutes,
                    nextAvailable: new Date(lastTest.getTime() + COOLDOWN_MS),
                    lastTestDate: lastTest,
                },
                lastAttempt,
            });
        }

        // Cooldown passed, allow retake
        next();

    } catch (error) {
        console.error("Retake cooldown check error:", error);
        // On error, allow the test (fail open)
        next();
    }
}

/**
 * Get cooldown status for a user (for frontend to check)
 */
async function getCooldownStatus(req, res) {
    try {
        const userId = req.params.userId || req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: "User ID required" });
        }

        const user = await User.findById(userId).select('lastTestDate history bestScoreEver');

        if (!user || !user.lastTestDate) {
            return res.json({
                canRetake: true,
                cooldown: {
                    active: false,
                },
            });
        }

        const now = new Date();
        const lastTest = new Date(user.lastTestDate);
        const timeSinceLastTest = now - lastTest;

        const cooldownActive = timeSinceLastTest < COOLDOWN_MS;

        let response = {
            canRetake: !cooldownActive,
            lastTestDate: lastTest,
        };

        if (cooldownActive) {
            const remainingMs = COOLDOWN_MS - timeSinceLastTest;
            const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
            const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

            response.cooldown = {
                active: true,
                remainingMs,
                remainingHours,
                remainingMinutes,
                nextAvailable: new Date(lastTest.getTime() + COOLDOWN_MS),
            };
        } else {
            response.cooldown = {
                active: false,
            };
        }

        // Add improvement tracking if history exists
        if (user.history && user.history.length > 0) {
            const recentAttempts = user.history.slice(-5); // Last 5 attempts
            const scores = recentAttempts.map(h => h.score);

            response.improvement = {
                attempts: user.history.length,
                recentScores: scores,
                bestScore: user.bestScoreEver || Math.max(...scores),
                lastScore: scores[scores.length - 1],
                trend: scores.length >= 2 ?
                    (scores[scores.length - 1] > scores[scores.length - 2] ? "improving" : "declining")
                    : "neutral",
            };
        }

        res.json(response);

    } catch (error) {
        console.error("Get cooldown status error:", error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    checkRetakeCooldown,
    getCooldownStatus,
    COOLDOWN_HOURS,
};
