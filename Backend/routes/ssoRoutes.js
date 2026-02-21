const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const { initializeSSO } = require('../Services/ssoService');

/**
 * SSO Login Initiation
 * GET /auth/sso/:provider/:orgSlug
 */
router.get('/sso/:provider/:orgSlug', async (req, res, next) => {
    try {
        const { provider, orgSlug } = req.params;

        // Find organization
        const organization = await Organization.findOne({
            slug: orgSlug,
            isActive: true,
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Check if SSO is enabled
        if (!organization.ssoConfig.enabled || organization.ssoConfig.provider !== provider) {
            return res.status(400).json({
                success: false,
                message: 'SSO is not enabled for this organization',
            });
        }

        // Initialize SSO strategy
        const strategy = initializeSSO(organization);
        const strategyName = `${provider}-${orgSlug}`;

        // Register strategy dynamically
        passport.use(strategyName, strategy);

        // Authenticate with the strategy
        passport.authenticate(strategyName, {
            session: false,
        })(req, res, next);
    } catch (error) {
        console.error('SSO initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate SSO',
            error: error.message,
        });
    }
});

/**
 * SSO Callback
 * POST /auth/sso/:provider/:orgSlug/callback
 */
router.post('/sso/:provider/:orgSlug/callback', async (req, res, next) => {
    try {
        const { provider, orgSlug } = req.params;

        // Find organization
        const organization = await Organization.findOne({
            slug: orgSlug,
            isActive: true,
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        const strategyName = `${provider}-${orgSlug}`;

        // Authenticate callback
        passport.authenticate(strategyName, { session: false }, (err, user) => {
            if (err || !user) {
                return res.status(401).json({
                    success: false,
                    message: 'SSO authentication failed',
                    error: err?.message,
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Send token
            res.json({
                success: true,
                message: 'SSO authentication successful',
                data: {
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        organization: user.organization,
                        organizationRole: user.organizationRole,
                    },
                },
            });
        })(req, res, next);
    } catch (error) {
        console.error('SSO callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete SSO authentication',
            error: error.message,
        });
    }
});

/**
 * SAML Metadata
 * GET /auth/saml/:orgSlug/metadata
 */
router.get('/saml/:orgSlug/metadata', async (req, res) => {
    try {
        const { orgSlug } = req.params;

        const organization = await Organization.findOne({
            slug: orgSlug,
            isActive: true,
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        if (organization.ssoConfig.provider !== 'saml') {
            return res.status(400).json({
                success: false,
                message: 'SAML is not configured for this organization',
            });
        }

        // Initialize SAML strategy to get metadata
        const strategy = initializeSSO(organization);
        const metadata = strategy.generateServiceProviderMetadata();

        res.type('application/xml');
        res.send(metadata);
    } catch (error) {
        console.error('SAML metadata error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate SAML metadata',
            error: error.message,
        });
    }
});

/**
 * Check SSO availability for email domain
 * POST /auth/sso/check
 */
router.post('/sso/check', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Find organization by email domain
        const organization = await Organization.findByEmailDomain(email);

        if (!organization || !organization.ssoConfig.enabled) {
            return res.json({
                success: true,
                ssoAvailable: false,
            });
        }

        res.json({
            success: true,
            ssoAvailable: true,
            data: {
                organizationName: organization.name,
                organizationSlug: organization.slug,
                ssoProvider: organization.ssoConfig.provider,
                loginUrl: `/auth/sso/${organization.ssoConfig.provider}/${organization.slug}`,
            },
        });
    } catch (error) {
        console.error('SSO check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check SSO availability',
            error: error.message,
        });
    }
});

module.exports = router;
