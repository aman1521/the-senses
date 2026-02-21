const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/public/:username', userProfileController.getPublicProfile);
router.get('/ranking', userProfileController.getGlobalRanking);

// Protected routes
router.use(auth());

// My profile
router.get('/me', userProfileController.getMyProfile);
router.put('/me', userProfileController.updateProfile);

// Test history & achievements
router.get('/me/test-history', userProfileController.getTestHistory);
router.get('/me/achievements', userProfileController.getAchievements);

// Hiring settings
router.put('/me/hiring-settings', userProfileController.updateHiringSettings);

// Search users (for recruiters)
router.get('/search', userProfileController.searchUsers);

module.exports = router;
