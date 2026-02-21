const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AzureAdOAuth2Strategy = require('passport-azure-ad').OIDCStrategy;
const Organization = require('../models/Organization');
const User = require('../models/User');

/**
 * Configure SSO strategies based on organization configuration
 */

// SAML Strategy Configuration
const configureSAMLStrategy = (org) => {
    if (!org.ssoConfig.saml || !org.ssoConfig.saml.entryPoint) {
        throw new Error('SAML configuration is incomplete');
    }

    return new SamlStrategy(
        {
            entryPoint: org.ssoConfig.saml.entryPoint,
            issuer: org.ssoConfig.saml.issuer || `thesenses-${org.slug}`,
            cert: org.ssoConfig.saml.cert,
            callbackUrl: org.ssoConfig.saml.callbackUrl || `${process.env.APP_URL}/auth/saml/callback/${org.slug}`,
        },
        async (profile, done) => {
            try {
                const email = profile.email || profile.nameID;
                const name = profile.displayName || profile.name || email.split('@')[0];

                // Find or create user
                let user = await User.findOne({ email }).select('+password');

                if (!user) {
                    // Create new user
                    user = await User.create({
                        email,
                        name,
                        organization: org._id,
                        ssoProvider: 'saml',
                        ssoId: profile.nameID,
                        ssoMetadata: new Map(Object.entries(profile)),
                        organizationRole: 'member',
                    });
                } else {
                    // Update existing user
                    user.organization = org._id;
                    user.ssoProvider = 'saml';
                    user.ssoId = profile.nameID;
                    user.ssoMetadata = new Map(Object.entries(profile));
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    );
};

// Google OAuth Strategy Configuration
const configureGoogleStrategy = (org) => {
    if (!org.ssoConfig.oauth || !org.ssoConfig.oauth.clientId) {
        throw new Error('Google OAuth configuration is incomplete');
    }

    return new GoogleStrategy(
        {
            clientID: org.ssoConfig.oauth.clientId,
            clientSecret: org.ssoConfig.oauth.clientSecret,
            callbackURL: org.ssoConfig.oauth.callbackUrl || `${process.env.APP_URL}/auth/google/callback/${org.slug}`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const name = profile.displayName;

                // Verify email domain matches organization
                const emailDomain = email.split('@')[1];
                if (emailDomain !== org.domain) {
                    return done(new Error('Email domain does not match organization'), null);
                }

                // Find or create user
                let user = await User.findOne({ email }).select('+password');

                if (!user) {
                    user = await User.create({
                        email,
                        name,
                        organization: org._id,
                        ssoProvider: 'google',
                        ssoId: profile.id,
                        profilePicture: profile.photos[0]?.value,
                        organizationRole: 'member',
                    });
                } else {
                    user.organization = org._id;
                    user.ssoProvider = 'google';
                    user.ssoId = profile.id;
                    user.profilePicture = user.profilePicture || profile.photos[0]?.value;
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    );
};

// Azure AD Strategy Configuration
const configureAzureStrategy = (org) => {
    if (!org.ssoConfig.oauth || !org.ssoConfig.oauth.clientId) {
        throw new Error('Azure AD configuration is incomplete');
    }

    return new AzureAdOAuth2Strategy(
        {
            identityMetadata: `https://login.microsoftonline.com/${org.ssoConfig.oauth.tenantId}/v2.0/.well-known/openid-configuration`,
            clientID: org.ssoConfig.oauth.clientId,
            clientSecret: org.ssoConfig.oauth.clientSecret,
            responseType: 'code id_token',
            responseMode: 'form_post',
            redirectUrl: org.ssoConfig.oauth.callbackUrl || `${process.env.APP_URL}/auth/azure/callback/${org.slug}`,
            allowHttpForRedirectUrl: process.env.NODE_ENV !== 'production',
            scope: ['profile', 'email', 'openid'],
        },
        async (iss, sub, profile, accessToken, refreshToken, done) => {
            try {
                const email = profile._json.email || profile._json.preferred_username;
                const name = profile.displayName;

                // Verify email domain matches organization
                const emailDomain = email.split('@')[1];
                if (emailDomain !== org.domain) {
                    return done(new Error('Email domain does not match organization'), null);
                }

                // Find or create user
                let user = await User.findOne({ email }).select('+password');

                if (!user) {
                    user = await User.create({
                        email,
                        name,
                        organization: org._id,
                        ssoProvider: 'azure',
                        ssoId: profile.oid || sub,
                        organizationRole: 'member',
                    });
                } else {
                    user.organization = org._id;
                    user.ssoProvider = 'azure';
                    user.ssoId = profile.oid || sub;
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    );
};

/**
 * Initialize SSO for an organization
 * @param {Object} org - Organization document
 * @returns {Strategy} Configured passport strategy
 */
const initializeSSO = (org) => {
    if (!org.ssoConfig.enabled) {
        throw new Error('SSO is not enabled for this organization');
    }

    switch (org.ssoConfig.provider) {
        case 'saml':
            return configureSAMLStrategy(org);
        case 'google':
            return configureGoogleStrategy(org);
        case 'azure':
            return configureAzureStrategy(org);
        default:
            throw new Error(`Unsupported SSO provider: ${org.ssoConfig.provider}`);
    }
};

/**
 * Get SSO login URL for organization
 * @param {string} orgSlug - Organization slug
 * @param {string} provider - SSO provider (saml, google, azure)
 * @returns {string} SSO login URL
 */
const getSSOLoginURL = (orgSlug, provider) => {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';

    switch (provider) {
        case 'saml':
            return `${baseUrl}/auth/saml/login/${orgSlug}`;
        case 'google':
            return `${baseUrl}/auth/google/${orgSlug}`;
        case 'azure':
            return `${baseUrl}/auth/azure/${orgSlug}`;
        default:
            throw new Error(`Unsupported SSO provider: ${provider}`);
    }
};

/**
 * Verify domain ownership for SSO setup
 * @param {string} domain - Domain to verify
 * @returns {Object} Verification token and instructions
 */
const generateDomainVerificationToken = (domain) => {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    return {
        token,
        txtRecord: `thesenses-verification=${token}`,
        instructions: `Add this TXT record to your DNS settings for ${domain}`,
    };
};

/**
 * Verify domain ownership
 * @param {string} domain - Domain to verify
 * @param {string} expectedToken - Expected verification token
 * @returns {Promise<boolean>} Verification result
 */
const verifyDomainOwnership = async (domain, expectedToken) => {
    const dns = require('dns').promises;

    try {
        const records = await dns.resolveTxt(domain);
        const flatRecords = records.flat();

        const verificationRecord = flatRecords.find((record) =>
            record.startsWith('thesenses-verification=')
        );

        if (!verificationRecord) {
            return false;
        }

        const token = verificationRecord.split('=')[1];
        return token === expectedToken;
    } catch (error) {
        console.error('Domain verification error:', error);
        return false;
    }
};

module.exports = {
    initializeSSO,
    configureSAMLStrategy,
    configureGoogleStrategy,
    configureAzureStrategy,
    getSSOLoginURL,
    generateDomainVerificationToken,
    verifyDomainOwnership,
};
