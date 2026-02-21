const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { auth } = require('../middleware/auth');

// Public route - get invite details (no auth required)
router.get('/:token/details', inviteController.getInviteDetails);

// Protected routes
router.use(auth());

// Accept/decline invites
router.post('/:token/accept', inviteController.acceptInvite);
router.post('/:token/decline', inviteController.declineInvite);

// Get user's pending invites
router.get('/pending', inviteController.getPendingInvites);

// Cancel invite (admin/inviter only)
router.delete('/:inviteId', inviteController.cancelInvite);

module.exports = router;
