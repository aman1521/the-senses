const User = require('../models/User');
const Post = require('../models/Post');
const PostBubble = require('../models/PostBubble');

exports.globalSearch = async (req, res) => {
    try {
        const { q, type } = req.query;
        if (!q) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const regex = new RegExp(q, 'i');
        let results = {};

        if (!type || type === 'all' || type === 'users') {
            const users = await User.find({
                $or: [{ name: regex }, { username: regex }, { currentRole: regex }]
            }).select('name username profilePicture currentRole verified tier').limit(10);
            results.users = users;
        }

        if (!type || type === 'all' || type === 'posts') {
            const posts = await Post.find({
                $or: [{ content: regex }, { tags: regex }, { category: regex }]
            }).populate('author', 'name username profilePicture verified').limit(15);
            results.posts = posts;
        }

        if (!type || type === 'all' || type === 'bubbles') {
            const bubbles = await PostBubble.find({
                $or: [{ topicLabel: regex }, { description: regex }, { tags: regex }]
            }).limit(10);
            results.bubbles = bubbles;
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Failed to perform search" });
    }
};
