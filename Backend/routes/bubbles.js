const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const bubbleController = require('../controllers/bubbleController');

/**
 * @route   GET /api/bubbles/feed
 * @desc    Get social feed (public posts)
 * @access  Public/Private (shows isLiked if authenticated)
 */
router.get('/feed', bubbleController.getSocialFeed);

/**
 * @route   GET /api/bubbles/trending
 * @desc    Get trending bubbles
 * @access  Public
 */
router.get('/trending', bubbleController.getTrendingBubbles);

/**
 * @route   POST /api/bubbles
 * @desc    Create a new bubble with origin post
 * @access  Private
 */
router.post('/', auth(), bubbleController.createBubble);

/**
 * @route   GET /api/bubbles/:bubbleId
 * @desc    Get bubble with all posts
 * @access  Public
 */
router.get('/:bubbleId', bubbleController.getBubble);

/**
 * @route   GET /api/bubbles/user/:userId
 * @desc    Get user's bubble participations
 * @access  Public
 */
router.get('/user/:userId', bubbleController.getUserBubbles);

/**
 * @route   POST /api/bubbles/posts
 * @desc    Create a post (standalone or in bubble)
 * @access  Private
 */
router.post('/posts', auth(), bubbleController.createPost);

/**
 * @route   POST /api/bubbles/posts/:postId/share
 * @desc    Share a post
 * @access  Private
 */
router.post('/posts/:postId/share', auth(), bubbleController.sharePost);

/**
 * @route   POST /api/bubbles/posts/:postId/like
 * @desc    Like/Unlike a post
 * @access  Private
 */
router.post('/posts/:postId/like', auth(), bubbleController.likePost);

/**
 * @route   DELETE /api/bubbles/posts/:postId
 * @desc    Delete a post
 * @access  Private
 */
router.delete('/posts/:postId', auth(), bubbleController.deletePost);

module.exports = router;
