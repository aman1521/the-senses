// controllers/apiTokenController.js
// Phase 6: Developer API Access — Personal Access Tokens

const crypto = require('crypto');
const User = require('../models/User');
const ApiToken = require('../models/ApiToken');

/**
 * POST /api/v1/developer/tokens
 * Create a new API token for the authenticated user
 */
exports.createToken = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, scopes = ['read:profile', 'read:results'], expiresInDays } = req.body;

        if (!name || name.trim().length < 3) {
            return res.status(400).json({ success: false, error: 'Token name must be at least 3 characters.' });
        }

        // Limit: max 5 tokens per user
        const existingCount = await ApiToken.countDocuments({ user: userId, isActive: true });
        if (existingCount >= 5) {
            return res.status(400).json({ success: false, error: 'Maximum of 5 active API tokens allowed.' });
        }

        // Generate secure token: sk_live_<random64hex>
        const rawToken = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const expiresAt = expiresInDays
            ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
            : null;

        const token = await ApiToken.create({
            user: userId,
            name: name.trim(),
            tokenHash,
            scopes,
            expiresAt,
            lastUsedAt: null
        });

        // Return raw token ONCE only — never stored again
        res.status(201).json({
            success: true,
            message: 'Token created. Copy it now — it will not be shown again.',
            token: {
                id: token._id,
                name: token.name,
                rawToken, // ← show once
                scopes: token.scopes,
                createdAt: token.createdAt,
                expiresAt: token.expiresAt
            }
        });
    } catch (err) {
        console.error('[ApiToken] createToken:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * GET /api/v1/developer/tokens
 * List all tokens for the authenticated user (no raw tokens exposed)
 */
exports.listTokens = async (req, res) => {
    try {
        const tokens = await ApiToken.find({ user: req.user._id })
            .select('-tokenHash')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, tokens });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * DELETE /api/v1/developer/tokens/:tokenId
 * Revoke a token
 */
exports.revokeToken = async (req, res) => {
    try {
        const { tokenId } = req.params;
        const token = await ApiToken.findOne({ _id: tokenId, user: req.user._id });

        if (!token) {
            return res.status(404).json({ success: false, error: 'Token not found.' });
        }

        token.isActive = false;
        await token.save();

        res.json({ success: true, message: 'Token revoked successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Middleware: Authenticate API requests using Bearer sk_live_* tokens
 */
exports.authenticateApiToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const rawToken = authHeader.startsWith('Bearer sk_live_') ? authHeader.slice(7) : null;

        if (!rawToken) {
            return res.status(401).json({ success: false, error: 'API token required.' });
        }

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const token = await ApiToken.findOne({ tokenHash, isActive: true });

        if (!token) {
            return res.status(401).json({ success: false, error: 'Invalid or revoked token.' });
        }

        if (token.expiresAt && new Date() > token.expiresAt) {
            return res.status(401).json({ success: false, error: 'Token has expired.' });
        }

        // Track usage
        token.lastUsedAt = new Date();
        token.usageCount = (token.usageCount || 0) + 1;
        await token.save();

        req.apiToken = token;
        req.user = await User.findById(token.user).select('-password');
        next();
    } catch (err) {
        res.status(500).json({ success: false, error: 'Token authentication failed.' });
    }
};
