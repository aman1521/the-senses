const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getDashboardStats, getTestHistory, getCareerAdvice } = require('../controllers/dashboardController');

router.get('/stats', auth(), getDashboardStats);
router.get('/history', auth(), getTestHistory);
router.get('/career-advice', auth(), getCareerAdvice);

module.exports = router;
