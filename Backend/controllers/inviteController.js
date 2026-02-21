const TeamInvite = require('../models/TeamInvite');
const Team = require('../models/Team');
const Organization = require('../models/Organization');
const User = require('../models/User');

/**
 * Accept team invite
 */
exports.acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;

        // Find invite
        const invite = await TeamInvite.findOne({ token })
            .populate('organization', 'name domain logo')
            .populate('team', 'name description')
            .populate('invitedBy', 'name email');

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found',
            });
        }

        // Check if invite is valid
        if (!invite.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'Invite has expired or is no longer valid',
            });
        }

        const userId = req.user._id;
        const userEmail = req.user.email;

        // Verify email matches
        if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'This invite was sent to a different email address',
            });
        }

        // Accept invite
        await invite.accept(userId);

        // Update user organization if not already set
        if (!req.user.organization) {
            await User.findByIdAndUpdate(userId, {
                organization: invite.organization._id,
                organizationRole: invite.role,
            });
        }

        // Add user to team if team is specified
        if (invite.team) {
            const team = await Team.findById(invite.team);

            if (team && !team.isMember(userId)) {
                await team.addMember(userId, invite.role, invite.invitedBy);
                await User.findByIdAndUpdate(userId, {
                    $addToSet: { teams: team._id },
                });
            }
        }

        res.json({
            success: true,
            message: 'Invite accepted successfully',
            data: {
                organization: invite.organization,
                team: invite.team,
            },
        });
    } catch (error) {
        console.error('Error accepting invite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept invite',
            error: error.message,
        });
    }
};

/**
 * Decline team invite
 */
exports.declineInvite = async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await TeamInvite.findOne({ token });

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found',
            });
        }

        if (!invite.isValid()) {
            return res.status(400).json({
                success: false,
                message: 'Invite has expired or is no longer valid',
            });
        }

        await invite.decline();

        res.json({
            success: true,
            message: 'Invite declined',
        });
    } catch (error) {
        console.error('Error declining invite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline invite',
            error: error.message,
        });
    }
};

/**
 * Get invite details
 */
exports.getInviteDetails = async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await TeamInvite.findOne({ token })
            .populate('organization', 'name domain logo')
            .populate('team', 'name description')
            .populate('invitedBy', 'name email profilePicture');

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found',
            });
        }

        res.json({
            success: true,
            data: {
                email: invite.email,
                organization: invite.organization,
                team: invite.team,
                role: invite.role,
                invitedBy: invite.invitedBy,
                expiresAt: invite.expiresAt,
                status: invite.status,
                isValid: invite.isValid(),
            },
        });
    } catch (error) {
        console.error('Error fetching invite details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch invite details',
            error: error.message,
        });
    }
};

/**
 * Get pending invites for logged-in user
 */
exports.getPendingInvites = async (req, res) => {
    try {
        const userEmail = req.user.email;

        const invites = await TeamInvite.findPendingByEmail(userEmail);

        res.json({
            success: true,
            data: invites,
        });
    } catch (error) {
        console.error('Error fetching pending invites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending invites',
            error: error.message,
        });
    }
};

/**
 * Cancel invite (admin/inviter only)
 */
exports.cancelInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;

        const invite = await TeamInvite.findById(inviteId);

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found',
            });
        }

        // Check if user can cancel (inviter or org admin)
        const organization = await Organization.findById(invite.organization);
        if (
            invite.invitedBy.toString() !== req.user._id.toString() &&
            !organization.isAdmin(req.user._id)
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this invite',
            });
        }

        invite.status = 'expired';
        await invite.save();

        res.json({
            success: true,
            message: 'Invite cancelled successfully',
        });
    } catch (error) {
        console.error('Error cancelling invite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel invite',
            error: error.message,
        });
    }
};

module.exports = exports;
