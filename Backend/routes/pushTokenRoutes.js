const express = require('express');
const router = express.Router();
const pushTokenController = require('../controllers/pushTokenController');
const { auth, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth());

// Register or update push token
router.post('/register', pushTokenController.registerToken);

// Get user's push tokens
router.get('/', pushTokenController.getUserTokens);

// Deactivate a token
router.post('/deactivate', pushTokenController.deactivateToken);

// Cleanup old tokens (admin only)
router.delete('/cleanup', requireRole('admin'), pushTokenController.cleanupTokens);

module.exports = router;
