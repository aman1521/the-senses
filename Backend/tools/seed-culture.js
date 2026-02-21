require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

// Connect to DB
mongoose.connect('mongodb://127.0.0.1:27017/thesenses_db')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => console.error(err));

const seedCulture = async () => {
    try {
        console.log("Clearing existing posts...");
        await Post.deleteMany({});

        // 1. Get or Create High-Status Users
        let users = await User.find({}).limit(5);
        if (users.length === 0) {
            console.log("Creating Mock Culture Users...");
            const mockUsers = [
                { name: "Dr. Elena V", email: "elena@senses.ai", password: "pass", role: "user", verified: true, stats: { percentile: 99 }, tier: "Grandmaster", profession: "AI Researcher" },
                { name: "Marcus Aurelius II", email: "marcus@senses.ai", password: "pass", role: "user", verified: true, stats: { percentile: 95 }, tier: "Master", profession: "Ethics Philosopher" },
                { name: "Sarah Q", email: "sarah@senses.ai", password: "pass", role: "user", verified: false, stats: { percentile: 88 }, tier: "Diamond", profession: "Quantum Physicist" },
                { name: "David M", email: "david@senses.ai", password: "pass", role: "user", verified: true, stats: { percentile: 92 }, tier: "Master", profession: "Macro Economist" },
                { name: "Unit 734", email: "unit734@senses.ai", password: "pass", role: "user", verified: false, stats: { percentile: 98 }, tier: "Grandmaster", profession: "Neuroscientist" }
            ];
            users = await User.create(mockUsers);
        }

        const posts = [
            {
                author: users[0]._id,
                content: "The alignment problem isn't technical, it's philosophical. We are trying to code morality into silicon without having a consensus on what morality is. Until we solve the human alignment problem, AI safety is a mirage.",
                postType: "insight",
                depthScore: 92,
                tags: ["AI", "Philosophy", "Safety"],
                engagementScore: 1540
            },
            {
                author: users[1]._id,
                content: "Universal Data Income (UDI) > UBI. If AI is trained on our collective data, the dividends should be paid out as data royalties, not charity.",
                postType: "debate",
                debateStance: "for",
                depthScore: 88,
                tags: ["Economics", "AI", "Policy"],
                engagementScore: 890
            },
            {
                author: users[2]._id,
                content: "Is consciousness a computation or a fundamental property of the universe? The latest Orch-OR theory updates suggest quantum collapse in microtubules might be the key.",
                postType: "question",
                depthScore: 85,
                tags: ["Neuroscience", "Physics", "Consciousness"],
                engagementScore: 620
            },
            {
                author: users[0]._id, // Same high rank user
                content: "Stop optimizing for 'happiness'. Optimize for 'antifragility'. A system that breaks under stress is useless, no matter how happy it is in the short term.",
                postType: "insight",
                depthScore: 95,
                tags: ["Stoicism", "Systems Thinking"],
                engagementScore: 2100,
                travelPhase: 3 // Trending
            },
            {
                author: users[3]._id,
                content: "Remote work is destroying mentorship. Junior developers are learning syntax but missing the 'implicit knowledge' transfer that happens in physical osmosis.",
                postType: "debate",
                debateStance: "against",
                depthScore: 78,
                tags: ["Career", "Remote Work", "Mentorship"],
                engagementScore: 1200
            }
        ];

        console.log("Seeding Culture Posts...");
        for (const p of posts) {
            await Post.create(p);
        }

        console.log("Seed Complete! Refresh Frontend.");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedCulture();
