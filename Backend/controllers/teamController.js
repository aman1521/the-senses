const Team = require('../models/Team');
const TeamInvite = require('../models/TeamInvite');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { sendEmail } = require('../Services/emailService');

/**
 * Create a new team
 */
exports.createTeam = async (req, res) => {
    try {
        const { name, description, tags, color } = req.body;
        const userId = req.user._id;
        const orgId = req.user.organization;

        if (!orgId) {
            return res.status(400).json({
                success: false,
                message: 'You must be part of an organization to create a team',
            });
        }

        // Check if user is admin or owner
        const organization = await Organization.findById(orgId);
        if (!organization.isAdmin(userId) && req.user.organizationRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can create teams',
            });
        }

        // Create team
        const team = await Team.create({
            name,
            description,
            organization: orgId,
            lead: userId,
            members: [
                {
                    user: userId,
                    role: 'lead',
                    addedBy: userId,
                },
            ],
            tags,
            color,
        });

        // Add team to user's teams
        await User.findByIdAndUpdate(userId, {
            $push: { teams: team._id },
        });

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: team,
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create team',
            error: error.message,
        });
    }
};

/**
 * Get all teams in organization
 */
exports.getOrganizationTeams = async (req, res) => {
    try {
        const { orgId } = req.params;
        const { page = 1, limit = 20, search } = req.query;

        // Check if user has access
        if (req.user.organization?.toString() !== orgId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this organization',
            });
        }

        // Build query
        const query = { organization: orgId, isActive: true };
        if (search) {
            query.name = new RegExp(search, 'i');
        }

        // Get teams with pagination
        const teams = await Team.find(query)
            .populate('lead', 'name email profilePicture')
            .populate('members.user', 'name email profilePicture')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Team.countDocuments(query);

        res.json({
            success: true,
            data: {
                teams,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message,
        });
    }
};

/**
 * Get team details
 */
exports.getTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId)
            .populate('organization', 'name logo')
            .populate('lead', 'name email profilePicture')
            .populate('members.user', 'name email profilePicture organizationRole')
            .populate('members.addedBy', 'name');

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if user has access
        if (
            req.user.organization?.toString() !== team.organization._id.toString() &&
            !team.isMember(req.user._id)
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this team',
            });
        }

        res.json({
            success: true,
            data: team,
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team',
            error: error.message,
        });
    }
};

/**
 * Update team
 */
exports.updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const updates = req.body;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if user is team lead or org admin
        const organization = await Organization.findById(team.organization);
        if (!team.isLead(req.user._id) && !organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only team leads or admins can update team',
            });
        }

        // Update allowed fields
        const allowedFields = ['name', 'description', 'tags', 'color', 'settings'];
        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key)) {
                team[key] = updates[key];
            }
        });

        await team.save();

        res.json({
            success: true,
            message: 'Team updated successfully',
            data: team,
        });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update team',
            error: error.message,
        });
    }
};

/**
 * Add member to team
 */
exports.addMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { userId, role = 'member' } = req.body;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if requester is team lead or org admin
        const organization = await Organization.findById(team.organization);
        if (!team.isLead(req.user._id) && !organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only team leads or admins can add members',
            });
        }

        // Check if user exists and is in same organization
        const user = await User.findById(userId);
        if (!user || user.organization?.toString() !== team.organization.toString()) {
            return res.status(404).json({
                success: false,
                message: 'User not found in organization',
            });
        }

        // Add member to team
        await team.addMember(userId, role, req.user._id);

        // Add team to user's teams
        await User.findByIdAndUpdate(userId, {
            $addToSet: { teams: teamId },
        });

        res.json({
            success: true,
            message: 'Member added successfully',
            data: team,
        });
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add member',
        });
    }
};

/**
 * Remove member from team
 */
exports.removeMember = async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if requester is team lead or org admin
        const organization = await Organization.findById(team.organization);
        if (!team.isLead(req.user._id) && !organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only team leads or admins can remove members',
            });
        }

        // Cannot remove team lead
        if (team.isLead(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove team lead. Transfer leadership first.',
            });
        }

        // Remove member from team
        await team.removeMember(userId);

        // Remove team from user's teams
        await User.findByIdAndUpdate(userId, {
            $pull: { teams: teamId },
        });

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
 * Invite member to team
 */
exports.inviteMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { email, role = 'member' } = req.body;

        const team = await Team.findById(teamId).populate('organization');

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if requester is team lead or org admin
        if (!team.isLead(req.user._id) && !team.organization.isAdmin(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only team leads or admins can invite members',
            });
        }

        // Check if user already exists in organization
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
            organization: team.organization._id,
        });

        if (existingUser) {
            // User exists, add directly to team
            await team.addMember(existingUser._id, role, req.user._id);
            await User.findByIdAndUpdate(existingUser._id, {
                $addToSet: { teams: teamId },
            });

            return res.json({
                success: true,
                message: 'User added to team directly',
                data: team,
            });
        }

        // Check for existing pending invite
        const existingInvite = await TeamInvite.findOne({
            email: email.toLowerCase(),
            team: teamId,
            status: 'pending',
            expiresAt: { $gt: new Date() },
        });

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: 'An invite has already been sent to this email',
            });
        }

        // Create invite
        const token = TeamInvite.generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invite = await TeamInvite.create({
            email: email.toLowerCase(),
            organization: team.organization._id,
            team: teamId,
            role,
            invitedBy: req.user._id,
            token,
            expiresAt,
        });

        // Send invite email
        const inviteUrl = `${process.env.APP_URL}/invite/accept/${token}`;

        // TODO: Implement sendEmail function
        // await sendEmail({
        //     to: email,
        //     subject: `You've been invited to join ${team.name}`,
        //     html: `You've been invited to join ${team.name} in ${team.organization.name}. Click here to accept: ${inviteUrl}`,
        // });

        res.json({
            success: true,
            message: 'Invite sent successfully',
            data: {
                invite,
                inviteUrl,
            },
        });
    } catch (error) {
        console.error('Error inviting member:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send invite',
        });
    }
};

/**
 * Get user's teams
 */
exports.getUserTeams = async (req, res) => {
    try {
        const userId = req.user._id;

        const teams = await Team.find({
            'members.user': userId,
            isActive: true,
        })
            .populate('organization', 'name logo')
            .populate('lead', 'name email profilePicture')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: teams,
        });
    } catch (error) {
        console.error('Error fetching user teams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message,
        });
    }
};

/**
 * Delete team
 */
exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if requester is team lead or org owner
        const organization = await Organization.findById(team.organization);
        if (
            !team.isLead(req.user._id) &&
            organization.owner.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Only team lead or organization owner can delete team',
            });
        }

        // Remove team from all users
        await User.updateMany(
            { teams: teamId },
            { $pull: { teams: teamId } }
        );

        // Soft delete team
        team.isActive = false;
        await team.save();

        res.json({
            success: true,
            message: 'Team deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete team',
            error: error.message,
        });
    }
};

module.exports = exports;
