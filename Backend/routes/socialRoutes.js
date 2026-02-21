const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const feedController = require('../controllers/feedController');
const { auth } = require('../middleware/auth');

// --- POST ACTIONS ---
router.post('/create-post', auth(), socialController.createPost);
router.post('/like-post', auth(), socialController.likePost);
router.post('/save-post', auth(), socialController.savePost);
router.post('/comment', auth(), socialController.commentOnPost);
router.post('/share-post', auth(), socialController.sharePost);
router.post('/ai-rewrite', auth(), socialController.aiRewrite);
router.post('/follow', auth(), socialController.followUser);

// --- FEED & DISCOVERY ---
router.get('/feed', auth(), feedController.getFeed);
router.get('/trending', feedController.getTrending); // Public?

// --- CONTENT RETRIEVAL ---
router.get('/user-posts/:userId', auth(false), socialController.getUserPosts); // Optional auth
router.get('/post/:id', auth(false), socialController.getPost);
router.get('/comments/:postId', auth(false), socialController.getComments);

module.exports = router;
