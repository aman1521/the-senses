const express = require('express');
const router = express.Router();
const companyProfileController = require('../controllers/companyProfileController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/:slug', companyProfileController.getCompanyBySlug);
router.get('/:companyId/jobs', companyProfileController.getActiveJobs);

// Protected routes
router.use(auth());

// Company CRUD
router.post('/', companyProfileController.createCompanyProfile);
router.put('/:companyId', companyProfileController.updateCompanyProfile);

// Job management
router.post('/:companyId/jobs', companyProfileController.createJobRole);

// Candidate management
router.post('/:companyId/candidates/invite', companyProfileController.inviteCandidate);
router.get('/:companyId/candidates', companyProfileController.getCandidates);
router.put('/:companyId/candidates/:candidateId', companyProfileController.updateCandidateStatus);

// Employee overview
router.get('/:companyId/employees', companyProfileController.getEmployeeOverview);

// Recruiter management
router.post('/:companyId/recruiters', companyProfileController.addRecruiter);

module.exports = router;
