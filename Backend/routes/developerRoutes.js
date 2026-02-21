const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { authenticateApiToken } = require('../controllers/apiTokenController');
const apiTokenController = require('../controllers/apiTokenController');
const IntelligenceResult = require('../models/IntelligenceResult');
const User = require('../models/User');

// ---- Token Management (requires user JWT auth) ----
router.post('/tokens', auth(), apiTokenController.createToken);
router.get('/tokens', auth(), apiTokenController.listTokens);
router.delete('/tokens/:tokenId', auth(), apiTokenController.revokeToken);

// ---- Public Developer API Endpoints (requires sk_live_ token) ----

/**
 * GET /api/v1/developer/me
 * Returns the authenticated user's profile (scoped: read:profile)
 */
router.get('/me', authenticateApiToken, async (req, res) => {
    if (!req.apiToken.scopes.includes('read:profile') && !req.apiToken.scopes.includes('admin')) {
        return res.status(403).json({ error: 'Token is missing read:profile scope.' });
    }
    const user = req.user;
    res.json({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
    });
});

/**
 * GET /api/v1/developer/results
 * Returns latest intelligence results for the token owner (scoped: read:results)
 */
router.get('/results', authenticateApiToken, async (req, res) => {
    if (!req.apiToken.scopes.includes('read:results') && !req.apiToken.scopes.includes('admin')) {
        return res.status(403).json({ error: 'Token is missing read:results scope.' });
    }
    const results = await IntelligenceResult
        .find({ userId: req.user._id.toString(), isFinalized: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('normalizedScore finalScore trustScore badge rank difficulty createdAt')
        .lean();

    res.json({ results });
});

module.exports = router;
