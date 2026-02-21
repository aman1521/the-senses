const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth());

// Organization CRUD
router.post('/', organizationController.createOrganization);
router.get('/:orgId', organizationController.getOrganization);
router.put('/:orgId', organizationController.updateOrganization);

// Member Management
router.get('/:orgId/members', organizationController.getMembers);
router.put('/:orgId/members/:userId/role', organizationController.updateMemberRole);
router.delete('/:orgId/members/:userId', organizationController.removeMember);

// SSO Configuration
router.post('/:orgId/sso/configure', organizationController.configureSS0);

// Domain Verification
router.post('/:orgId/domain/verify-request', organizationController.requestDomainVerification);
router.post('/:orgId/domain/verify', organizationController.verifyDomain);

module.exports = router;
