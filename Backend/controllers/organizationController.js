const Organization = require('../models/Organization');
const User = require('../models/User');
const {
    generateDomainVerificationToken,
    verifyDomainOwnership,
    getSSOLoginURL,
} = require('../Services/ssoService');

/**
 * Create a new organization
 */
exports.createOrganization = async (req, res) => {
    try {
        const { name, domain, plan = 'starter' } = req.body;
        const userId = req.user._id;

        // Check if domain is already taken
        const existingOrg = await Organization.findOne({ domain: domain.toLowerCase() });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'Domain is already registered to another organization',
            });
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Create organization
        const organization = await Organization.create({
            name,
            slug,
            domain: domain.toLowerCase(),
            plan,
            owner: userId,
            admins: [userId],
        });

        // Update user's organization and role
        await User.findByIdAndUpdate(userId, {
            organization: organization._id,
            organizationRole: 'owner',
        });

        res.status(201).json({
            success: true,
            message: 'Organization created successfully',
            data: organization,
        });
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create organization',
            error: error.message,
        });
    }
};

/**
 * Get organization details
 */
exports.getOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;

        const organization = await Organization.findById(orgId)
            .populate('owner', 'name email profilePicture')
            .populate('admins', 'name email profilePicture');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Check if user has access
        if (
            !organization.isAdmin(req.user._id) &&
            req.user.organization?.toString() !== orgId
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this organization',
            });
        }

        // Get member count
        const memberCount = await User.countDocuments({ organization: orgId });

        res.json({
            success: true,
            data: {
                ...organization.toObject(),
                memberCount,
            },
        });
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organization',
            error: error.message,
        });
    }
};

/**
 * Update organization
 */
exports.updateOrganization = async (req, res) => {
    try {
        const { orgId } = req.params;
        const updates = req.body;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Check if user is admin
        if (!organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update organization settings',
            });
        }

        // Update allowed fields
        const allowedFields = ['name', 'logo', 'settings'];
        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key)) {
                organization[key] = updates[key];
            }
        });

        await organization.save();

        res.json({
            success: true,
            message: 'Organization updated successfully',
            data: organization,
        });
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update organization',
            error: error.message,
        });
    }
};

/**
 * Get organization members
 */
exports.getMembers = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { page = 1, limit = 20, role, search } = req.query;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Check access
        if (req.user.organization?.toString() !== orgId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this organization',
            });
        }

        // Build query
        const query = { organization: orgId };
        if (role) query.organizationRole = role;
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
            ];
        }

        // Get members with pagination
        const members = await User.find(query)
            .select('name email profilePicture organizationRole teams createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('teams', 'name');

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                members,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch members',
            error: error.message,
        });
    }
};

/**
 * Update member role
 */
exports.updateMemberRole = async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const { role } = req.body;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Check if requester is admin
        if (!organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update member roles',
            });
        }

        // Cannot change owner role
        if (organization.owner.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change owner role',
            });
        }

        // Update user role
        const user = await User.findById(userId);

        if (!user || user.organization?.toString() !== orgId) {
            return res.status(404).json({
                success: false,
                message: 'User not found in this organization',
            });
        }

        user.organizationRole = role;
        await user.save();

        // Update admin list if needed
        if (role === 'admin' && !organization.admins.includes(userId)) {
            await organization.addAdmin(userId);
        } else if (role !== 'admin' && organization.admins.includes(userId)) {
            await organization.removeAdmin(userId);
        }

        res.json({
            success: true,
            message: 'Member role updated successfully',
            data: user,
        });
    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update member role',
            error: error.message,
        });
    }
};

/**
 * Remove member from organization
 */
exports.removeMember = async (req, res) => {
    try {
        const { orgId, userId } = req.params;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Check if requester is admin
        if (!organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can remove members',
            });
        }

        // Cannot remove owner
        if (organization.owner.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove organization owner',
            });
        }

        // Remove user from organization
        await User.findByIdAndUpdate(userId, {
            $unset: { organization: 1 },
            organizationRole: 'member',
            teams: [],
        });

        // Remove from admin list if present
        await organization.removeAdmin(userId);

        res.json({
            success: true,
            message: 'Member removed successfully',
        });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove member',
            error: error.message,
        });
    }
};

/**
 * Configure SSO for organization
 */
exports.configureSS0 = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { provider, config } = req.body;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Only owner can configure SSO
        if (organization.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only organization owner can configure SSO',
            });
        }

        // Check if plan supports SSO
        if (!organization.features.sso) {
            return res.status(403).json({
                success: false,
                message: 'Your plan does not include SSO. Please upgrade to Enterprise.',
            });
        }

        // Update SSO configuration
        organization.ssoConfig.provider = provider;
        organization.ssoConfig.enabled = true;

        if (provider === 'saml') {
            organization.ssoConfig.saml = config;
        } else {
            organization.ssoConfig.oauth = config;
        }

        await organization.save();

        // Get SSO login URL
        const loginURL = getSSOLoginURL(organization.slug, provider);

        res.json({
            success: true,
            message: 'SSO configured successfully',
            data: {
                provider,
                loginURL,
                organization,
            },
        });
    } catch (error) {
        console.error('Error configuring SSO:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to configure SSO',
            error: error.message,
        });
    }
};

/**
 * Request domain verification
 */
exports.requestDomainVerification = async (req, res) => {
    try {
        const { orgId } = req.params;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Only owner can verify domain
        if (organization.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only organization owner can verify domain',
            });
        }

        // Generate verification token
        const verification = generateDomainVerificationToken(organization.domain);

        res.json({
            success: true,
            data: verification,
        });
    } catch (error) {
        console.error('Error requesting domain verification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to request domain verification',
            error: error.message,
        });
    }
};

/**
 * Verify domain
 */
exports.verifyDomain = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { token } = req.body;

        const organization = await Organization.findById(orgId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found',
            });
        }

        // Verify domain ownership
        const isVerified = await verifyDomainOwnership(organization.domain, token);

        if (!isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Domain verification failed. Please check your DNS settings.',
            });
        }

        // Update organization
        organization.verifiedDomain = true;
        await organization.save();

        res.json({
            success: true,
            message: 'Domain verified successfully',
            data: organization,
        });
    } catch (error) {
        console.error('Error verifying domain:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify domain',
            error: error.message,
        });
    }
};

module.exports = exports;
