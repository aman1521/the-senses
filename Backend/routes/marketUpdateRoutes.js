const express = require('express');
const router = express.Router();
const MarketUpdate = require('../models/MarketUpdate');
const User = require('../models/User'); // Need to get user profile if not in req.user
const { auth } = require('../middleware/auth');
const { JOB_PROFILES } = require('../data/jobProfiles');

// @route   GET /api/market-updates/feed
// @desc    Get updates tailored to the logged-in user's profile
router.get('/feed', auth(), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        let filter = {};

        // Smart Filtering Logic
        if (user.profileType) {
            // Find category for this profile
            const profileDef = JOB_PROFILES.find(p => p.id === user.profileType);
            const category = profileDef ? profileDef.category : null;

            // Match either specific profileType OR the broader category
            filter = {
                $or: [
                    { targetProfileTypes: user.profileType },
                    { targetProfileTypes: 'all' },
                    ...(category ? [{ targetCategories: category }] : [])
                ]
            };
        } else {
            // Fallback for users without a set profile
            filter = { targetProfileTypes: 'all' };
        }

        const updates = await MarketUpdate.find(filter)
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            updates
        });

    } catch (error) {
        console.error("Market Feed Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// @route   POST /api/market-updates/seed (Dev only)
// @desc    Seed some sample data
router.post('/seed', async (req, res) => {
    try {
        await MarketUpdate.deleteMany({});

        const seeds = [
            {
                title: "Launch: Adobe Firefly for Enterprise",
                summary: "Adobe releases new generative AI tools specifically for enterprise marketing teams.",
                targetProfileTypes: ["marketing-manager", "content-writer", "graphic-designer", "ux-ui-designer"],
                targetCategories: ["Creative", "Business"],
                type: "tool_launch",
                source: "Adobe Press",
                imageUrl: "https://via.placeholder.com/600x300/ff0000/ffffff?text=Adobe+Firefly"
            },
            {
                title: "React 19 Beta Announced",
                summary: "The new React compiler is set to revolutionize frontend performance by auto-memoizing components.",
                targetProfileTypes: ["software-engineer", "frontend-developer", "full-stack-developer"],
                targetCategories: ["Technology"],
                type: "tool_launch",
                source: "React Blog",
                imageUrl: "https://via.placeholder.com/600x300/61dafb/000000?text=React+19"
            },
            {
                title: "Global Supply Chain Report 2026",
                summary: "Logistics costs are expected to drop by 12% due to autonomous trucking adoption.",
                targetProfileTypes: ["supply-chain-manager", "operations-manager"],
                targetCategories: ["Operations"],
                type: "industry_trend",
                source: "Logistics Weekly",
                imageUrl: "https://via.placeholder.com/600x300/10b981/ffffff?text=Supply+Chain"
            },
            {
                title: "The Rise of 'Fractional' CFOs",
                summary: "More startups are hiring part-time CFOs for strategic guidance without the full-time cost.",
                targetProfileTypes: ["financial-analyst", "accountant", "entrepreneur"],
                targetCategories: ["Finance", "Business"],
                type: "industry_trend",
                source: "Forbes",
                imageUrl: "https://via.placeholder.com/600x300/f59e0b/ffffff?text=Fractional+CFO"
            },
            {
                title: "Google Gemini 2.0 Released",
                summary: "The next generation of multimodal AI models is now available via API.",
                targetProfileTypes: ["all", "software-engineer", "data-scientist"],
                targetCategories: ["Technology"],
                type: "tool_launch",
                source: "Google DeepMind",
                imageUrl: "https://via.placeholder.com/600x300/4285f4/ffffff?text=Gemini+2.0"
            }
        ];

        await MarketUpdate.insertMany(seeds);
        res.json({ success: true, count: seeds.length });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
