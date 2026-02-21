const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { listQuestions, contribute, approve, pullNext } = require('../controllers/questionsController');
const { ROLES } = require('../utils/roles');

const router = express.Router();
router.get('/', auth(false), asyncHandler(listQuestions));
router.get('/next', auth(true), asyncHandler(pullNext));
router.post('/contribute', auth(true), asyncHandler(contribute));
router.post('/approve', auth(true), requireRole(ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN), asyncHandler(approve));

module.exports = router;
