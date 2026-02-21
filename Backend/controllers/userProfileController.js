const User = require('../models/User');
const CompanyProfile = require('../models/CompanyProfile');
const IntelligenceResult = require('../models/IntelligenceResult');

/**
 * Get user's own complete profile
 */
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .populate('company', 'name logo industry')
            .populate('organization', 'name logo')
            .populate('teams', 'name')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get test history with anti-cheat verification
        const testHistory = await IntelligenceResult.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('finalScore createdAt difficulty integrityReport');

        // Calculate score progression
        const scoreProgression = testHistory.map((test) => ({
            score: test.finalScore,
            date: test.createdAt,
            difficulty: test.difficulty,
            antiCheatVerified: test.integrityReport?.overallTrustScore >= 80,
        }));

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                scoreProgression,
                testHistory,
            },
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message,
        });
    }
};

/**
 * Get public profile by username
 */
exports.getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username, isPublic: true })
            .select(
                'name username profilePicture verified globalThinkingScore profession globalRank globalRankPercentile country bio skills yearsOfExperience experienceLevel thinkingMetrics achievements activity publicProfileSettings hiringSettings createdAt'
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found or is private',
            });
        }

        // Filter data based on publicProfileSettings
        const profileData = {
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            verified: user.verified,
            globalThinkingScore: user.globalThinkingScore,
            profession: user.profession,
            globalRank: user.globalRank,
            globalRankPercentile: user.globalRankPercentile,
            country: user.publicProfileSettings?.showLocation ? user.country : null,
            bio: user.bio,
            skills: user.skills,
            yearsOfExperience: user.yearsOfExperience,
            experienceLevel: user.experienceLevel,
            joinedAt: user.createdAt,
        };

        if (user.publicProfileSettings?.showThinkingMetrics) {
            profileData.thinkingMetrics = user.thinkingMetrics;
        }

        if (user.publicProfileSettings?.showAchievements) {
            profileData.achievements = user.achievements;
        }

        if (user.publicProfileSettings?.showActivity) {
            profileData.activity = {
                testsCompleted: user.activity?.testsCompleted,
                challengesAttempted: user.activity?.challengesAttempted,
            };
        }

        if (user.publicProfileSettings?.showTestHistory) {
            const recentTests = await IntelligenceResult.find({ user: user._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('finalScore createdAt difficulty');

            profileData.recentTests = recentcTests;
        }

        // Check if user is open to hiring
        if (user.hiringSettings?.openToHiring) {
            profileData.openToHiring = true;
            profileData.hiringLinks = {
                portfolio: user.hiringSettings.portfolioUrl,
                linkedin: user.hiringSettings.linkedinUrl,
                github: user.hiringSettings.githubUrl,
            };
        }

        res.json({
            success: true,
            data: profileData,
        });
    } catch (error) {
        console.error('Error fetching public profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public profile',
            error: error.message,
        });
    }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        // Fields that can be updated
        const allowedUpdates = [
            'name',
            'username',
            'profilePicture',
            'bio',
            'profession',
            'country',
            'skills',
            'yearsOfExperience',
            'experienceLevel',
            'isPublic',
            'hiringSettings',
            'publicProfileSettings',
            'notificationSettings',
        ];

        // Filter updates to only allowed fields
        const filteredUpdates = {};
        Object.keys(updates).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        // Check if username is unique
        if (filteredUpdates.username) {
            const existingUser = await User.findOne({
                username: filteredUpdates.username,
                _id: { $ne: userId },
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken',
                });
            }
        }

        const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
            new: true,
            runValidators: true,
        }).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

/**
 * Get global ranking
 */
exports.getGlobalRanking = async (req, res) => {
    try {
        const { page = 1, limit = 50, profession, country } = req.query;

        const filter = { globalThinkingScore: { $gt: 0 }, isPublic: true };
        if (profession) filter.profession = profession;
        if (country) filter.country = country;

        const users = await User.find(filter)
            .sort({ globalThinkingScore: -1, createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select(
                'name username profilePicture globalThinkingScore profession country verified globalRank globalRankPercentile'
            );

        const total = await User.countDocuments(filter);

        // Add rank numbers (pagination-aware)
        const rankedUsers = users.map((user, index) => ({
            ...user.toObject(),
            rankPosition: (page - 1) * limit + index + 1,
        }));

        res.json({
            success: true,
            data: {
                users: rankedUsers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching ranking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ranking',
            error: error.message,
        });
    }
};

/**
 * Get user's test history
 */
exports.getTestHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const tests = await IntelligenceResult.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('finalScore createdAt difficulty profileType duration integrityReport');

        const total = await IntelligenceResult.countDocuments({ user: userId });

        // Calculate statistics
        const allTests = await IntelligenceResult.find({ user: userId }).select('finalScore');
        const scores = allTests.map((t) => t.finalScore);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

        res.json({
            success: true,
            data: {
                tests,
                statistics: {
                    totalTests: total,
                    averageScore: Math.round(avgScore),
                    bestScore: maxScore,
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching test history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch test history',
            error: error.message,
        });
    }
};

/**
 * Get user achievements
 */
exports.getAchievements = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('achievements globalRank globalRankPercentile testsTaken bestScoreEver');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Calculate progress towards next milestones
        const nextMilestones = [
            { rank: 1000, title: 'Top 1000' },
            { rank: 500, title: 'Elite 500' },
            { rank: 100, title: 'Top 100' },
            { rank: 50, title: 'Elite 50' },
            { rank: 10, title: 'Top 10' },
        ];

        const upcomingMilestone = nextMilestones.find((m) => (user.globalRank || 999999) > m.rank);

        res.json({
            success: true,
            data: {
                achievements: user.achievements,
                currentRank: user.globalRank,
                percentile: user.globalRankPercentile,
                upcomingMilestone,
                stats: {
                    testsTaken: user.testsTaken,
                    bestScore: user.bestScoreEver,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch achievements',
            error: error.message,
        });
    }
};

/**
 * Search users (for recruiters)
 */
exports.searchUsers = async (req, res) => {
    try {
        const {
            profession,
            minScore,
            maxScore,
            percentileMin,
            skills,
            experienceLevel,
            country,
            openToHiring,
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {
            isPublic: true,
            globalThinkingScore: { $gt: 0 },
        };

        if (profession) filter.profession = profession;
        if (minScore) filter.globalThinkingScore = { ...filter.globalThinkingScore, $gte: parseInt(minScore) };
        if (maxScore) filter.globalThinkingScore = { ...filter.globalThinkingScore, $lte: parseInt(maxScore) };
        if (percentileMin) filter.globalRankPercentile = { $gte: parseInt(percentileMin) };
        if (experienceLevel) filter.experienceLevel = experienceLevel;
        if (country) filter.country = country;
        if (openToHiring === 'true') filter['hiringSettings.openToHiring'] = true;

        // Skills filter (if provided as comma-separated string)
        if (skills) {
            const skillsArray = skills.split(',').map((s) => s.trim());
            filter.skills = { $in: skillsArray };
        }

        const users = await User.find(filter)
            .sort({ globalThinkingScore: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select(
                'name username profilePicture globalThinkingScore profession country globalRank globalRankPercentile experienceLevel skills hiringSettings.openToHiring verified'
            );

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users',
            error: error.message,
        });
    }
};

/**
 * Update hiring settings
 */
exports.updateHiringSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const hiringSettings = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { hiringSettings },
            {
                new: true,
                runValidators: true,
            }
        ).select('hiringSettings');

        res.json({
            success: true,
            message: 'Hiring settings updated successfully',
            data: user.hiringSettings,
        });
    } catch (error) {
        console.error('Error updating hiring settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hiring settings',
            error: error.message,
        });
    }
};

module.exports = exports;
