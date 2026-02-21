const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Team name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        // Team lead/manager
        lead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Team members with roles
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['member', 'lead', 'analyst'],
                    default: 'member',
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
                addedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            },
        ],
        // Team settings
        settings: {
            visibility: {
                type: String,
                enum: ['public', 'private'],
                default: 'private',
            },
            allowSelfJoin: {
                type: Boolean,
                default: false,
            },
        },
        // Team metadata
        tags: [String],
        color: {
            type: String,
            default: '#6366f1',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
teamSchema.index({ organization: 1, isActive: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ lead: 1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Method to add member
teamSchema.methods.addMember = async function (userId, role = 'member', addedBy = null) {
    const existingMember = this.members.find(
        (m) => m.user.toString() === userId.toString()
    );

    if (existingMember) {
        throw new Error('User is already a member of this team');
    }

    this.members.push({
        user: userId,
        role,
        addedBy,
        addedAt: new Date(),
    });

    await this.save();
    return this;
};

// Method to remove member
teamSchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(
        (m) => m.user.toString() !== userId.toString()
    );
    await this.save();
    return this;
};

// Method to update member role
teamSchema.methods.updateMemberRole = async function (userId, newRole) {
    const member = this.members.find(
        (m) => m.user.toString() === userId.toString()
    );

    if (!member) {
        throw new Error('User is not a member of this team');
    }

    member.role = newRole;
    await this.save();
    return this;
};

// Method to check if user is member
teamSchema.methods.isMember = function (userId) {
    return this.members.some((m) => m.user.toString() === userId.toString());
};

// Method to check if user is lead
teamSchema.methods.isLead = function (userId) {
    return this.lead && this.lead.toString() === userId.toString();
};

// Method to get member role
teamSchema.methods.getMemberRole = function (userId) {
    const member = this.members.find(
        (m) => m.user.toString() === userId.toString()
    );
    return member ? member.role : null;
};

// Static method to find teams by organization
teamSchema.statics.findByOrganization = function (orgId, includeInactive = false) {
    const query = { organization: orgId };
    if (!includeInactive) {
        query.isActive = true;
    }
    return this.find(query).populate('lead members.user');
};

// Static method to find user's teams
teamSchema.statics.findUserTeams = function (userId) {
    return this.find({
        'members.user': userId,
        isActive: true,
    }).populate('organization lead');
};

module.exports = mongoose.model('Team', teamSchema);
