const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth());

// User's teams
router.get('/my-teams', teamController.getUserTeams);

// Organization teams
router.get('/organization/:orgId', teamController.getOrganizationTeams);

// Team CRUD
router.post('/', teamController.createTeam);
router.get('/:teamId', teamController.getTeam);
router.put('/:teamId', teamController.updateTeam);
router.delete('/:teamId', teamController.deleteTeam);

// Member Management
router.post('/:teamId/members', teamController.addMember);
router.delete('/:teamId/members/:userId', teamController.removeMember);

// Invitations
router.post('/:teamId/invite', teamController.inviteMember);

module.exports = router;
