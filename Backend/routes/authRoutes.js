const express = require("express");
const {
    register,
    login,
    forgotPassword,
    resetPassword,
    oauthCallback
} = require("../controllers/authController");
const { successResponse } = require("../utils/apiResponse");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

/**
 * @swagger
 * /auth/oauth-status:
 *   get:
 *     summary: Check available OAuth providers
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: List of available providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 google: { type: boolean }
 *                 linkedin: { type: boolean }
 */
router.get("/oauth-status", (req, res) => {
    res.json({
        google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
        linkedin: !!process.env.LINKEDIN_CLIENT_ID && !!process.env.LINKEDIN_CLIENT_SECRET
    });
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, description: "Min 8 chars, 1 uppercase, 1 lowercase, 1 number" }
 *               profileType: { type: string }
 *               experienceLevel: { type: string }
 *               claimSessionId: { type: string, description: "Optional session ID to claim scores" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResp'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResp'
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: specific Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResp'
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset link sent
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", resetPassword);

// OAuth Routes
// These redirect to the OAuth provider
router.get("/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
    const scope = encodeURIComponent('email profile');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;

    if (req.query.json === 'true') {
        return successResponse(res, { url: authUrl });
    }

    res.redirect(authUrl);
});

router.get("/google/callback", async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            throw new Error('Failed to get access token');
        }

        // Get user profile
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const profile = await profileResponse.json();

        // Use the oauthCallback controller logic
        const User = require('../models/User');
        const jwt = require('jsonwebtoken');

        let user = await User.findOne({ email: profile.email.toLowerCase() });

        if (!user) {
            const baseHandle = profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            user = await User.create({
                name: profile.name,
                email: profile.email.toLowerCase(),
                username: baseHandle + Math.floor(Math.random() * 1000),
                profilePicture: profile.picture,
                oauthProvider: 'google',
                oauthId: profile.id
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth-callback?token=${token}&userId=${user._id}&userName=${encodeURIComponent(user.name)}&profileType=${user.profileType || ''}`);

    } catch (error) {
        console.error('Google OAuth error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
});

router.get("/linkedin", (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/linkedin/callback`;
    const scope = encodeURIComponent('openid profile email');

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    if (req.query.json === 'true') {
        return successResponse(res, { url: authUrl });
    }

    res.redirect(authUrl);
});

router.get("/linkedin/callback", async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/linkedin/callback`
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            throw new Error('Failed to get LinkedIn access token');
        }

        // Get user profile using OpenID Connect userinfo endpoint
        const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const profile = await profileResponse.json();

        // LinkedIn profile data structure
        const linkedInData = {
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            profilePicture: profile.picture,
            // Additional fields if available
            locale: profile.locale
        };

        const User = require('../models/User');
        const jwt = require('jsonwebtoken');

        let user = await User.findOne({ email: linkedInData.email.toLowerCase() });

        if (!user) {
            const baseHandle = linkedInData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            user = await User.create({
                name: linkedInData.name,
                email: linkedInData.email.toLowerCase(),
                username: baseHandle + Math.floor(Math.random() * 1000),
                profilePicture: linkedInData.profilePicture,
                oauthProvider: 'linkedin',
                oauthId: linkedInData.id
            });
        } else {
            // Update profile picture if not set
            if (!user.profilePicture && linkedInData.profilePicture) {
                user.profilePicture = linkedInData.profilePicture;
                await user.save();
            }
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth-callback?token=${token}&userId=${user._id}&userName=${encodeURIComponent(user.name)}&profileType=${user.profileType || ''}`);

    } catch (error) {
        console.error('LinkedIn OAuth error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
});

/**
 * @swagger
 * /auth/oauth/callback:
 *   post:
 *     summary: OAuth callback manual handling
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider, profile]
 *     responses:
 *       200:
 *         description: Auth successful
 */
router.post("/oauth/callback", oauthCallback);

module.exports = router;
