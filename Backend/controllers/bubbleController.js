const Post = require('../models/Post');
const PostBubble = require('../models/PostBubble');
const BubbleNode = require('../models/BubbleNode');
const User = require('../models/User');

// Anti-spam tracking (in-memory for now, use Redis in production)
const userBubbleCreationTracker = new Map();
const userPostCreationTracker = new Map();

/**
 * Create a new standalone post
 */
exports.createPost = async (req, res) => {
    try {
        const { content, media, tags, category, visibility, bubbleId } = req.body;
        const userId = req.user._id;

        // Anti-spam check (max 10 posts per hour)
        const userKey = userId.toString();
        const now = Date.now();
        const userPosts = userPostCreationTracker.get(userKey) || [];
        const recentPosts = userPosts.filter((timestamp) => now - timestamp < 3600000);

        if (recentPosts.length >= 10) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please wait before creating another post.',
            });
        }

        // Create post
        const post = await Post.create({
            author: userId,
            content,
            media: media || [],
            tags: tags || [],
            category: category || 'general',
            visibility: visibility || 'public',
            postType: bubbleId ? 'bubble' : 'standalone',
            bubble: bubbleId || null,
        });

        // Update anti-spam tracker
        recentPosts.push(now);
        userPostCreationTracker.set(userKey, recentPosts);

        // If in bubble, update bubble metrics & Create BubbleNode (Mind Map Logic)
        if (bubbleId) {
            const bubble = await PostBubble.findById(bubbleId);
            if (bubble) {
                await bubble.addParticipant(userId);
                await bubble.incrementPostCount();

                // MIND MAP: Create Node
                // If parentPostId exists, this is a reply in the tree.
                // If not, it attaches to the Root (Origin) or is a floater? 
                // Let's assume default attachment to Root if not specified, or if generic "Add to bubble".

                const parentPostId = req.body.parentPostId || req.body.replyTo; // robust check
                let parentNodeId = null;
                let depth = 0;

                if (parentPostId) {
                    const parentNode = await BubbleNode.findOne({ post: parentPostId });
                    if (parentNode) {
                        parentNodeId = parentNode._id;
                        depth = parentNode.depth + 1;
                        // Update parent child count
                        await BubbleNode.findByIdAndUpdate(parentNode._id, { $inc: { childCount: 1 } });
                    }
                } else {
                    // Try to find Root Node (depth 0)
                    const rootNode = await BubbleNode.findOne({ bubble: bubbleId, depth: 0 });
                    if (rootNode) {
                        parentNodeId = rootNode._id;
                        depth = 1;
                        await BubbleNode.findByIdAndUpdate(rootNode._id, { $inc: { childCount: 1 } });
                    }
                }

                await BubbleNode.create({
                    bubble: bubbleId,
                    post: post._id,
                    parentNode: parentNodeId,
                    depth: depth,
                    childCount: 0
                });
            }
        }

        // Populate author
        await post.populate('author', 'name username profilePicture verified');

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post,
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create post',
            error: error.message,
        });
    }
};

/**
 * Share a post
 */
exports.sharePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { shareNote, visibility } = req.body;
        const userId = req.user._id;

        const originalPost = await Post.findById(postId);

        if (!originalPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        // Create share post
        const sharePost = await Post.create({
            author: userId,
            content: shareNote || `Shared a post by @${originalPost.author.username}`,
            sharedFrom: postId,
            postType: 'share',
            visibility: visibility || 'public',
        });

        // Update original post
        originalPost.engagement.shares += 1;
        originalPost.sharedBy.push({
            user: userId,
            sharedAt: new Date(),
            shareNote,
        });
        await originalPost.save();

        await sharePost.populate([
            { path: 'author', select: 'name username profilePicture verified' },
            {
                path: 'sharedFrom',
                populate: { path: 'author', select: 'name username profilePicture verified' },
            },
        ]);

        res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            data: sharePost,
        });
    } catch (error) {
        console.error('Error sharing post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share post',
            error: error.message,
        });
    }
};

/**
 * Get social feed (public posts)
 */
exports.getSocialFeed = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, tags } = req.query;
        const userId = req.user?._id;

        const filter = {
            visibility: 'public',
            postType: { $in: ['standalone', 'share'] },
        };

        if (category) filter.category = category;
        if (tags) {
            const tagArray = tags.split(',');
            filter.tags = { $in: tagArray };
        }

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('author', 'name username profilePicture verified globalThinkingScore')
            .populate({
                path: 'sharedFrom',
                populate: { path: 'author', select: 'name username profilePicture verified' },
            })
            .populate('quotedPost', 'content author')
            .lean();

        // Add isLiked flag if user is authenticated
        const enrichedPosts = posts.map((post) => ({
            ...post,
            isLiked: userId ? post.likedBy?.some((id) => id.toString() === userId.toString()) : false,
        }));

        const total = await Post.countDocuments(filter);

        res.json({
            success: true,
            data: {
                posts: enrichedPosts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch feed',
            error: error.message,
        });
    }
};

/**
 * Create a new bubble
 */
exports.createBubble = async (req, res) => {
    try {
        const { topicLabel, description, originPostContent, category, tags } = req.body;
        const userId = req.user._id;

        // Anti-spam check (max 5 bubbles per day)
        const userKey = userId.toString();
        const now = Date.now();
        const userBubbles = userBubbleCreationTracker.get(userKey) || [];
        const recentBubbles = userBubbles.filter((timestamp) => now - timestamp < 86400000);

        if (recentBubbles.length >= 5) {
            return res.status(429).json({
                success: false,
                message: 'Daily bubble creation limit reached. Please try again tomorrow.',
            });
        }

        // Create origin post
        const originPost = await Post.create({
            author: userId,
            content: originPostContent,
            postType: 'bubble',
            visibility: 'public',
        });

        // Create bubble
        const bubble = await PostBubble.create({
            originPost: originPost._id,
            topicLabel,
            description: description || '',
            createdBy: userId,
            category: category || 'general',
            tags: tags || [],
            participants: [userId],
        });

        // Update post with bubble reference
        originPost.bubble = bubble._id;
        await originPost.save();

        // MIND MAP: Create ROOT Node
        await BubbleNode.create({
            bubble: bubble._id,
            post: originPost._id,
            parentNode: null,
            depth: 0,
            childCount: 0
        });

        // Update anti-spam tracker
        recentBubbles.push(now);
        userBubbleCreationTracker.set(userKey, recentBubbles);

        await bubble.populate([
            { path: 'originPost', populate: { path: 'author', select: 'name username profilePicture' } },
            { path: 'createdBy', select: 'name username profilePicture' },
        ]);

        res.status(201).json({
            success: true,
            message: 'Bubble created successfully',
            data: bubble,
        });
    } catch (error) {
        console.error('Error creating bubble:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bubble',
            error: error.message,
        });
    }
};

/**
 * Get bubble details with posts
 */
exports.getBubble = async (req, res) => {
    try {
        const { bubbleId } = req.params;

        const bubble = await PostBubble.findById(bubbleId)
            .populate('originPost')
            .populate('createdBy', 'name username profilePicture')
            .populate('participants', 'name username profilePicture globalThinkingScore');

        if (!bubble) {
            return res.status(404).json({
                success: false,
                message: 'Bubble not found',
            });
        }

        // MIND MAP: Build Tree Structure
        const nodes = await BubbleNode.find({ bubble: bubbleId })
            .populate({
                path: 'post',
                populate: { path: 'author', select: 'name username profilePicture verified globalThinkingScore' }
            })
            .sort({ depth: 1, createdAt: 1 }) // BFS-ish sort
            .lean();

        // Map nodes to a dictionary and reconstruct tree
        const nodeMap = {};
        let rootNode = null;

        // 1. Initialize Map
        nodes.forEach(node => {
            // Helper properties for Frontend ease
            if (node.post) {
                node.content = node.post.content;
                node.author = node.post.author?.name || 'Anonymous';
                node.authorPic = node.post.author?.profilePicture;
                node.timestamp = node.post.createdAt;
                node.upvotes = node.post.engagement?.likes || 0;
                node.id = node._id; // aliases
                node.postId = node.post._id;
            }
            node.children = [];
            nodeMap[node._id.toString()] = node;
        });

        // 2. Link Children
        nodes.forEach(node => {
            if (node.parentNode) {
                const parent = nodeMap[node.parentNode.toString()];
                if (parent) {
                    parent.children.push(node);
                }
            } else if (node.depth === 0) {
                rootNode = node;
            }
        });

        res.json({
            success: true,
            data: {
                bubble,
                rootNode, // Check if null??
                nodeCount: nodes.length
            },
        });
    } catch (error) {
        console.error('Error fetching bubble:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bubble',
            error: error.message,
        });
    }
};

/**
 * Get trending bubbles
 */
exports.getTrendingBubbles = async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;

        const filter = { status: 'active' };
        if (category) filter.category = category;

        // Recalculate trending scores
        const allBubbles = await PostBubble.find(filter);
        for (const bubble of allBubbles) {
            bubble.calculateTrendingScore();
            await bubble.save();
        }

        const bubbles = await PostBubble.find(filter)
            .sort({ trendingScore: -1, lastActivityAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'name username profilePicture verified')
            .populate({
                path: 'originPost',
                populate: { path: 'author', select: 'name username profilePicture' },
            })
            .lean();

        const total = await PostBubble.countDocuments(filter);

        res.json({
            success: true,
            data: {
                bubbles,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching trending bubbles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending bubbles',
            error: error.message,
        });
    }
};

/**
 * Get user's bubbles
 */
exports.getUserBubbles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const bubbles = await PostBubble.find({
            participants: userId,
            status: 'active',
        })
            .sort({ lastActivityAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'name username profilePicture')
            .select('topicLabel description participantCount postCount lastActivityAt category tags');

        const total = await PostBubble.countDocuments({
            participants: userId,
            status: 'active',
        });

        res.json({
            success: true,
            data: {
                bubbles,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching user bubbles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user bubbles',
            error: error.message,
        });
    }
};

/**
 * Like/Unlike a post
 */
exports.likePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        const hasLiked = post.isLikedBy(userId);

        if (hasLiked) {
            // Unlike
            post.likedBy = post.likedBy.filter((id) => id.toString() !== userId.toString());
            post.engagement.likes = Math.max(0, post.engagement.likes - 1);
        } else {
            // Like
            post.likedBy.push(userId);
            post.engagement.likes += 1;

            // Update bubble engagement if post is in bubble
            if (post.bubble) {
                const bubble = await PostBubble.findById(post.bubble);
                if (bubble) {
                    bubble.engagement.totalLikes += 1;
                    bubble.calculateTrendingScore();
                    await bubble.save();
                }
            }
        }

        await post.save();

        res.json({
            success: true,
            data: {
                liked: !hasLiked,
                likeCount: post.engagement.likes,
            },
        });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to like post',
            error: error.message,
        });
    }
};

/**
 * Delete post
 */
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        // Check if user is author
        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own posts',
            });
        }

        await post.deleteOne();

        res.json({
            success: true,
            message: 'Post deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete post',
            error: error.message,
        });
    }
};

module.exports = exports;
