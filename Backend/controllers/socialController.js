const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const Follow = require('../models/Follow');
const User = require('../models/User');
const PostBubble = require('../models/PostBubble');
const BubbleNode = require('../models/BubbleNode');

// --- Helper: Calculate Cognitive Weight ---
async function calculateCognitiveWeight(user) {
    let weight = 0;

    // 1. Thinking Score Percentile (0-100)
    // Normalized to 0-10 range
    const percentile = user.stats?.percentile || 0;
    weight += (percentile / 10);

    // 2. Verification Boost
    if (user.verified) {
        weight += 5; // Significant boost
    }

    // 3. Historical Performance (Mock for now, could be avg engagement of last 5 posts)
    // weight += user.avgPostEngagement || 0;

    return weight;
}

// --- Helper: Recalculate Engagement Score ---
// Formula: (weightedLikes * 1) + (comments * 2.5) + (shares * 3.0) + (saves * 5.0) + (dwell * 0.5) + (cognitiveWeight * 2.0)
async function updateEngagementScore(post) {
    const likes = post.engagement.weightedLikes || post.engagement.likes; // Use weighted if available
    const comments = post.engagement.comments;
    const shares = post.engagement.shares;
    const saves = post.engagement.saves || 0;
    const avgDwellTime = post.analyticsData?.avgReadTime || 0;
    const cognitiveWeight = post.cognitiveWeight || 0;

    const score = (likes * 1.0)
        + (comments * 2.5)
        + (shares * 3.0)
        + (saves * 5.0) // Strong signal 
        + (avgDwellTime * 0.5)
        + (cognitiveWeight * 2.0);

    post.engagementScore = score;

    // Check for Phase Transition (Travel Logic)
    // Phase 1 -> 2 threshold: Score > 50?
    if (post.travelPhase === 1 && score > 50) {
        post.travelPhase = 2;
    } else if (post.travelPhase === 2 && score > 200) {
        post.travelPhase = 3; // Global/Trending
    }

    await post.save();
    return score;
}

// --- SECTION 2: CREATE POST ---
exports.createPost = async (req, res) => {
    // SECTION 2: CREATE POST (CULTURE UPDATE)
    try {
        const { content, media, visibility, tags, postType, debateStance, intent, domain, scheduledAt, cognitiveCategory } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Calculate measures
        const cognitiveWeight = await calculateCognitiveWeight(user);

        // --- AI Depth Rating (Simulated) ---
        // New Formula: Base + Intent Bonus + Length Bonus + User Tier Bonus
        let baseDepth = 40;
        if (content.length > 500) baseDepth += 20;
        else if (content.length > 200) baseDepth += 10;

        if (postType === 'debate' || intent === 'debate_invitation') baseDepth += 15;
        if (postType === 'insight' || intent === 'insight') baseDepth += 10;
        if (intent === 'analysis') baseDepth += 20;
        if (user.stats?.percentile > 90) baseDepth += 10;

        // Random jitter for realism not strictly deterministic
        const jitter = Math.floor(Math.random() * 10) - 5;
        const depthScore = Math.min(Math.max(baseDepth + jitter, 0), 100);
        const reasoningClarity = Math.min(depthScore - 5, 100);

        const newPost = new Post({
            author: userId,
            content,
            media: media || [],
            visibility: visibility || 'public',
            tags: tags || [],
            cognitiveWeight,
            engagementScore: 0,
            isVerifiedContent: user.verified,

            // Culture Fields
            postType: postType || 'insight',
            intent: intent || 'generic',
            debateStance: postType === 'debate' ? (debateStance || 'neutral') : null,
            depthScore,
            reasoningClarity,

            // New Metadata
            domain: domain || null,
            category: cognitiveCategory || 'general',
            scheduledAt: scheduledAt || null,
            isPublished: !scheduledAt // If scheduled, not published immediately
        });

        if (req.body.bubbleId) {
            newPost.bubble = req.body.bubbleId;
        }

        await newPost.save();

        // --- BUBBLE / MIND MAP LOGIC ---
        if (req.body.bubbleId) {
            const bubble = await PostBubble.findById(req.body.bubbleId);
            if (bubble) {
                await bubble.addParticipant(userId);
                await bubble.incrementPostCount();

                // Create BubbleNode (Tree Logic)
                const parentPostId = req.body.parentPostId || req.body.replyTo;
                let parentNodeId = null;
                let depth = 0;

                if (parentPostId) {
                    const parentNode = await BubbleNode.findOne({ post: parentPostId });
                    if (parentNode) {
                        parentNodeId = parentNode._id;
                        depth = parentNode.depth + 1;
                        await BubbleNode.findByIdAndUpdate(parentNode._id, { $inc: { childCount: 1 } });
                    }
                } else {
                    const rootNode = await BubbleNode.findOne({ bubble: req.body.bubbleId, depth: 0 });
                    if (rootNode) {
                        parentNodeId = rootNode._id;
                        depth = 1;
                        await BubbleNode.findByIdAndUpdate(rootNode._id, { $inc: { childCount: 1 } });
                    }
                }

                await BubbleNode.create({
                    bubble: req.body.bubbleId,
                    post: newPost._id,
                    parentNode: parentNodeId,
                    depth: depth,
                    childCount: 0
                });
            }
        }

        // Feed Distribution Queue Push (Mock)
        console.log(`[Queue] Pushing Post ${newPost._id} to Feed Distribution Engine...`);

        // Populate author for response
        await newPost.populate('author', 'name username profilePicture verified tier');

        res.status(201).json({ success: true, data: newPost });

    } catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json({ message: "Failed to create post", error: error.message });
    }
};

// --- SIMULATED AI REWRITE ---
exports.aiRewrite = async (req, res) => {
    try {
        const { content, intent } = req.body;

        // Mock rewriting logic
        // Strategy 1: Intellectual Framing
        const strategies = [
            "Consider the second-order effects: ",
            "From a systems thinking perspective, ",
            "The underlying data suggests that ",
            "Crucially, we must observe that "
        ];

        const randomPrefix = strategies[Math.floor(Math.random() * strategies.length)];
        let improved = content;

        if (content.length < 50) {
            improved += " This micro-trend warrants deeper analysis regarding its long-term viability.";
        } else if (!content.includes(randomPrefix)) {
            improved = randomPrefix + content.charAt(0).toLowerCase() + content.slice(1);
        }

        // Ensure it ends with a period if missing
        if (!improved.endsWith('.')) improved += '.';

        // Simulate improved depth
        const estimatedDepth = Math.floor(Math.random() * 20) + 75; // 75-95 range

        res.json({
            success: true,
            rewritten: improved,
            depthScore: estimatedDepth,
            suggestions: ["Add a specific data point", "Cite a historical precedent", "Address the counter-argument"]
        });
    } catch (error) {
        res.status(500).json({ message: "AI Rewrite failed" });
    }
};

// --- SECTION 3: LIKE POST (Weighted) ---
exports.likePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const user = await User.findById(userId);

        // Calculate Weight
        // Base = 1. Top percentile (e.g. >90) = 1.5. Verified = +0.2?
        let weight = 1.0;
        if (user.stats?.percentile && user.stats.percentile > 90) {
            weight = 1.5;
        }

        const existingLike = await PostLike.findOne({ post: postId, user: userId });

        if (existingLike) {
            // Unlike logic
            await PostLike.deleteOne({ _id: existingLike._id });
            post.engagement.likes = Math.max(0, post.engagement.likes - 1);
            post.engagement.weightedLikes = Math.max(0, (post.engagement.weightedLikes || 0) - weight);

            post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
        } else {
            // Like logic
            await PostLike.create({ post: postId, user: userId });
            post.engagement.likes += 1;
            post.engagement.weightedLikes = (post.engagement.weightedLikes || 0) + weight;

            post.likedBy.push(userId);

            // Trigger Real-Time Notification
            const { createInAppNotification } = require('../Services/inAppNotificationService');
            await createInAppNotification(req, {
                recipient: post.author,
                type: 'social_like',
                title: 'New Like ❤️',
                message: `${user.name} liked your post.`,
                data: { relatedId: postId, link: `/post/${postId}` }
            });
        }

        await updateEngagementScore(post);

        res.json({ success: true, likes: post.engagement.likes, isLiked: !existingLike });

    } catch (error) {
        console.error("Like Error:", error);
        res.status(500).json({ message: "Failed to like post" });
    }
};

// --- SAVE POST ---
exports.savePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user._id;
        const PostSave = require('../models/PostSave'); // Lazy load

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const existingSave = await PostSave.findOne({ post: postId, user: userId });

        if (existingSave) {
            // Unsave
            await PostSave.deleteOne({ _id: existingSave._id });
            post.engagement.saves = Math.max(0, (post.engagement.saves || 0) - 1);
            post.savedBy = post.savedBy.filter(id => id.toString() !== userId.toString());
        } else {
            // Save
            await PostSave.create({ post: postId, user: userId });
            post.engagement.saves = (post.engagement.saves || 0) + 1;
            post.savedBy.push(userId);
        }

        await updateEngagementScore(post);

        res.json({ success: true, saves: post.engagement.saves, isSaved: !existingSave });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ message: "Failed to save post" });
    }
};

// --- SECTION 4: COMMENT ---
exports.commentOnPost = async (req, res) => {
    try {
        const { postId, content, parentCommentId } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = await Comment.create({
            post: postId,
            user: userId,
            content,
            parentComment: parentCommentId || null
        });

        // Update post metadata
        post.engagement.comments += 1;
        await updateEngagementScore(post);

        // Trigger Real-Time Notification
        const { createInAppNotification } = require('../Services/inAppNotificationService');
        await createInAppNotification(req, {
            recipient: post.author,
            type: 'social_comment',
            title: 'New Comment 💬',
            message: `${req.user.name || 'Someone'} commented on your post.`,
            data: { relatedId: postId, link: `/post/${postId}` }
        });

        // Populate user for return
        await comment.populate('user', 'name username profilePicture verified');

        res.status(201).json({ success: true, comment });

    } catch (error) {
        console.error("Comment Error:", error);
        res.status(500).json({ message: "Failed to post comment" });
    }
};

// --- SHARE POST ---
exports.sharePost = async (req, res) => {
    try {
        const { postId } = req.body; // or params
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Logic: Create a new post that references this one? Or just increment counter?
        // Prompt Section 13 says "Share functionality".
        // Usually creates a new post with 'sharedFrom' field.

        post.engagement.shares += 1;
        await post.save();

        // Setup new post as a "Share"
        // For MVP, just increment counter and return success
        // In full version, create a new Post of type 'share'
        /*
        const sharePost = new Post({
            author: userId,
            content: "", // or user comment
            postType: 'share',
            sharedFrom: postId,
            visibility: 'public'
        });
        await sharePost.save();
        */

        await updateEngagementScore(post);

        res.json({ success: true, shares: post.engagement.shares });

    } catch (error) {
        console.error("Share Error:", error);
        res.status(500).json({ message: "Failed to share post" });
    }
};

// --- GET POST DETAILED ---
exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id)
            .populate('author', 'name username profilePicture verified tier stats')
            .lean();

        if (!post) return res.status(404).json({ message: "Post not found" });

        // Attach additional state (isLiked)
        post.isLiked = false;
        if (req.user) {
            const like = await PostLike.exists({ post: id, user: req.user._id });
            post.isLiked = !!like;
        }

        // Fetch top comments
        const comments = await Comment.find({ post: id, parentComment: null })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name username profilePicture verified');

        res.json({ success: true, post, comments });

    } catch (error) {
        res.status(500).json({ message: "Error fetching post" });
    }
};

// --- GET POST COMMENTS ---
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId })
            .sort({ createdAt: 1 })
            .populate('user', 'name username profilePicture verified');

        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ message: "Error fetching comments" });
    }
};

// --- FOLLOW USER ---
exports.followUser = async (req, res) => {
    try {
        const { userIdToFollow } = req.body;
        const followerId = req.user._id;

        if (userIdToFollow === followerId.toString()) {
            return res.status(400).json({ message: "Cannot follow yourself" });
        }

        const existingFollow = await Follow.findOne({ follower: followerId, following: userIdToFollow });

        if (existingFollow) {
            await Follow.deleteOne({ _id: existingFollow._id });
            res.json({ success: true, isFollowing: false });
        } else {
            await Follow.create({ follower: followerId, following: userIdToFollow });
            res.json({ success: true, isFollowing: true });
        }
    } catch (error) {
        res.status(500).json({ message: "Follow action failed" });
    }
};

// --- GET USER POSTS ---
exports.getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .populate('author', 'name username profilePicture verified tier stats')
            .lean();

        // Enrich with isLiked if viewer is logged in
        if (req.user) {
            for (const post of posts) {
                post.isLiked = await PostLike.exists({ post: post._id, user: req.user._id });
            }
        }

        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user posts" });
    }
};
