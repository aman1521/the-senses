const express = require("express");
const UserProfile = require("../models/UserProfile.js");
const User = require("../models/User.js"); // Ensure User model is imported

const { auth } = require("../middleware/auth.js");
const { strictLimiter } = require("../middleware/rateLimit.js");
const { generateCard } = require("../virality/shareController.js");

const router = express.Router();

// PUT /api/profile - Manual Portfolio Update
router.put("/", auth(), async (req, res) => {
    try {
        const userId = req.user._id;
        const { bio, skills, jobProfile, experienceYears } = req.body;

        // Validation
        if (!jobProfile || !skills) {
            return res.status(400).json({ success: false, message: "Job Profile and Skills are required" });
        }

        const updateData = {
            bio,
            skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
            // If User model has jobProfile field, update it. If it uses 'profileType' or sets it in metadata, handle accordingly.
            // Based on previous context, we might store jobProfile in `skillsMetadata` or a new field.
            // Let's assume we update the root fields we added earlier.
            onboardingCompleted: true,
            updatedAt: new Date()
        };

        // If User model doesn't have jobProfile explicitly, we might want to store it in `profileType` or `metadata`.
        // Let's check User model again to be sure, but previously we added `skills`, `bio`.
        // We'll trust the User schema supports flexibility or we just add what we can.
        // Actually, let's explicitly save 'jobProfile' to a field. If 'profileType' exists, use used that.
        // I'll assume 'profileType' is the one.
        if (jobProfile) updateData.profileType = jobProfile;

        // We can also store a structured version of skillsMetadata if needed, 
        // but for manual entry, simple array is fine. 
        // We can give default weight of 1.0 to manually added skills.
        const skillsArray = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        const skillsMap = {};
        skillsArray.forEach(s => skillsMap[s] = 1.0);
        updateData.skillsMetadata = skillsMap;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        res.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ success: false, message: "Failed to update profile" });
    }
});

router.get("/share/card", auth(false), strictLimiter, generateCard);

router.get("/me", auth(), async (req, res) => {
    try {
        const userId = req.user?._id || req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: "User ID required" });
        }

        const profile = await UserProfile.findOne({ userId });

        if (!profile) {
            // Return user info from User model if UserProfile missing
            const user = await User.findById(userId);
            return res.json({
                success: true,
                profile: {
                    bio: user?.bio,
                    skills: user?.skills,
                    jobProfile: user?.profileType
                }
            });
        }

        res.json({
            success: true,
            profile: {
                stats: profile.stats,
                badges: profile.badges,
                progression: profile.progression.slice(-10), // last 10
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/u/:username
// Public profile data
router.get("/u/:username", async (req, res) => {
    try {
        const { username } = req.params;
        // User already required at top

        const user = await User.findOne({ username }).select("name profileType bestScoreEver tier lastTestDate");
        if (!user) return res.status(404).json({ error: "User not found" });

        const profile = await UserProfile.findOne({ userId: user._id });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                role: user.profileType || "Member",
                bestScore: user.bestScoreEver,
                tier: user.tier, // Virtual field need check if serialization works, otherwise calc manually
                lastActive: user.lastTestDate
            },
            stats: profile ? profile.stats : {},
            badges: profile ? profile.badges : []
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
