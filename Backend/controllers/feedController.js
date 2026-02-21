const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');
const PostLike = require('../models/PostLike');
const Comment = require('../models/Comment');

// --- Helper: Recency Decay ---
function calculateRecencyScore(createdAt) {
    const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    // Exponential decay: e^(-hours/24) * 100
    // At 0 hrs = 100. At 24 hrs = ~36. At 48 hrs = ~13.
    return Math.exp(-hoursSince / 24) * 100;
}

// --- Helper: Relationship Score ---
async function calculateRelationshipScore(userId, authorId, user) {
    if (!userId) return 0;

    let score = 0;
    const isFollowing = await Follow.exists({ follower: userId, following: authorId });
    if (isFollowing) score += 50; // Big boost for following

    // Shared profession
    // if (user.profession && user.profession === author.profession) score += 20;

    return Math.min(score, 100);
}

// --- Helper: Cognitive Authority Score ---
function calculateCognitiveAuthority(author) {
    // Formula: (user_percentile * 0.5) + (verified ? 20 : 0) + (domain_rank * 0.3)
    const percentile = author.stats?.percentile || 50; // Default to mid
    const verified = author.verified ? 1 : 0;

    let score = (percentile * 0.8) + (verified * 20);
    return Math.min(score, 100);
}

// --- Helper: Interest Match Score (Mocked Vector Sim) ---
function calculateInterestMatch(user, post) {
    if (!user) return 50; // Neutral for anon

    // In real system: cos(user_vector, post_vector)
    // Here: Tag overlap
    const postTags = post.tags || [];
    const userSkills = user.skills || [];

    const overlap = postTags.filter(tag => userSkills.includes(tag)).length;
    if (overlap > 0) return 80 + (overlap * 5); // Start high if relevant
    return 40; // Base baseline
}

// --- MAIN FEED ALGORITHM ---
exports.getFeed = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 20, type = 'foryou' } = req.query;

        console.log(`[Feed] Generating ${type} feed for user ${userId || 'anon'}`);

        let query = { visibility: 'public', isPublished: true };

        // --- TAB LOGIC ---
        if (type === 'following' && userId) {
            const following = await Follow.find({ follower: userId }).select('following');
            const followingIds = following.map(f => f.following);
            query = { ...query, author: { $in: followingIds } };
        } else if (type === 'trending') {
            query = { ...query, travelPhase: { $in: [2, 3] } }; // Only phase 2/3 posts
        } else if (type === 'elite') {
            // Only top 1% content (mocked as cognitiveDepth='strategic' or author tier)
            // query = { ...query, 'author.stats.percentile': { $gt: 90 } }; // Needs join/aggreg, simplified here:
            // We'll filter in memory or rely on 'travelPhase' 3 which is elite
            query = { ...query, travelPhase: 3 };
        }

        // Fetch candidates 
        // Use aggregation for better perf in production
        const candidates = await Post.find(query)
            .sort({ createdAt: -1 }) // Initial fetch by time to get candidates
            .limit(200) // Deep candidate pool
            .populate('author', 'name username profilePicture verified tier stats profession')
            .lean();

        const user = userId ? await User.findById(userId) : null;
        const PostLike = require('../models/PostLike'); // Lazy load
        const PostSave = require('../models/PostSave'); // Lazy load

        // Score Candidates with Hybrid Formula
        const rankedPosts = await Promise.all(candidates.map(async (post) => {
            // 1. Engagement Score (Normalized 0-100)
            // Raw score can be high, compress it. Log scale.
            // If score is 50, log(51) * 20 ~= 3.9 * 20 = 80.
            let engagementInput = post.engagementScore || 0;
            let engagementScore = Math.min(Math.log(engagementInput + 1) * 25, 100);

            // 2. Cognitive Authority (0-100)
            const authorityScore = calculateCognitiveAuthority(post.author);

            // 3. Interest Match (0-100)
            const interestScore = calculateInterestMatch(user, post);

            // 4. Relationship Score (0-100)
            const relationshipScore = await calculateRelationshipScore(userId, post.author._id, user);

            // 5. Recency Decay (0-100)
            const recencyScore = calculateRecencyScore(post.createdAt);

            // 6. Depth Score (0-100)
            // AI-assigned or manual. Default to 50 for now.
            // If post has 'depthScore' stored (from creation AI analysis), use it.
            const depthScore = Math.min((post.depthScore || 0) + (post.reasoningClarity || 0), 100);

            // --- CULTURE BLUEPRINT FORMULA ---
            // (depth * 0.30) + (authority * 0.25) + (engagement * 0.20) + (interest * 0.15) + (recency * 0.10)

            let finalScore =
                (depthScore * 0.30) +
                (authorityScore * 0.25) +
                (engagementScore * 0.20) +
                (interestScore * 0.15) +
                (recencyScore * 0.10);

            // Boosts for Debate Winners / Strategic Depth
            if (post.depthScore > 80) finalScore *= 1.2;
            if (post.debateWinner) finalScore *= 1.5;

            // Prestige Circles Filter
            if (type === 'elite' && authorityScore < 90) finalScore = 0;

            return { ...post, finalScore, debug: { depthScore, engagementScore, authorityScore } };
        }));

        // Sort by Final Score
        rankedPosts.sort((a, b) => b.finalScore - a.finalScore);

        // Pagination
        const start = (page - 1) * limit;
        const pagedPosts = rankedPosts.slice(start, start + parseInt(limit));

        // Enrich with isLiked/isSaved
        if (userId) {
            for (const post of pagedPosts) {
                post.isLiked = await PostLike.exists({ post: post._id, user: userId });
                post.isSaved = await PostSave.exists({ post: post._id, user: userId });
            }
        }

        res.json({ success: true, posts: pagedPosts });

    } catch (error) {
        console.error("Feed Error:", error);
        res.status(500).json({ message: "Failed to generate feed" });
    }
};

// --- TRENDING ENGINE (Section 9) ---
exports.getTrending = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Fetch posts from last 24hrs
        const candidates = await Post.find({
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
            .populate('author', 'name username profilePicture')
            .lean();

        // Calculate Trending Score
        // (engagement_score / hours_since_posted)
        candidates.forEach(post => {
            const hoursAge = Math.max(0.1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
            post.trendingScore = (post.engagementScore || 0) / hoursAge;
        });

        candidates.sort((a, b) => b.trendingScore - a.trendingScore);

        res.json({ success: true, posts: candidates.slice(0, parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ message: "Error fetching trending" });
    }
};
