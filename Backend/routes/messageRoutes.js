const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

router.get('/conversations', auth(), messageController.getConversations);
router.get('/messages/:conversationId', auth(), messageController.getMessages);
router.post('/send', auth(), messageController.sendMessage);
router.put('/read', auth(), messageController.markAsRead);

module.exports = router;
