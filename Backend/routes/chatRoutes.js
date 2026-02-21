const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { handleOnboardingMessage, resetChat } = require('../controllers/chatController');

router.post('/onboarding', auth(), handleOnboardingMessage);
router.post('/reset', auth(), resetChat);

module.exports = router;
