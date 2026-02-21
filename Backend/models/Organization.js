const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        domain: {
            type: String,
            required: [true, 'Domain is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        logo: {
            type: String,
            default: null,
        },
        plan: {
            type: String,
            enum: ['starter', 'professional', 'enterprise'],
            default: 'starter',
        },
        maxUsers: {
            type: Number,
            default: 50,
        },
        features: {
            sso: {
                type: Boolean,
                default: false,
            },
            advancedAnalytics: {
                type: Boolean,
                default: false,
            },
            customBranding: {
                type: Boolean,
                default: false,
            },
            apiAccess: {
                type: Boolean,
                default: false,
            },
        },
        // SSO Configuration
        ssoConfig: {
            enabled: {
                type: Boolean,
                default: false,
            },
            provider: {
                type: String,
                enum: ['saml', 'google', 'azure', 'okta', null],
                default: null,
            },
            // SAML Configuration
            saml: {
                entryPoint: String,
                issuer: String,
                cert: String,
                callbackUrl: String,
            },
            // OAuth Configuration (Google, Azure)
            oauth: {
                clientId: String,
                clientSecret: String,
                callbackUrl: String,
                tenantId: String, // For Azure AD
            },
        },
        // Billing Information
        billing: {
            customerId: String, // Stripe customer ID
            subscriptionId: String,
            status: {
                type: String,
                enum: ['active', 'trial', 'suspended', 'cancelled'],
                default: 'trial',
            },
            trialEndsAt: Date,
            currentPeriodEnd: Date,
        },
        // Settings
        settings: {
            allowSelfSignup: {
                type: Boolean,
                default: true,
            },
            requireEmailVerification: {
                type: Boolean,
                default: true,
            },
            defaultRole: {
                type: String,
                enum: ['member', 'analyst', 'admin'],
                default: 'member',
            },
            passwordPolicy: {
                minLength: {
                    type: Number,
                    default: 8,
                },
                requireUppercase: {
                    type: Boolean,
                    default: true,
                },
                requireNumbers: {
                    type: Boolean,
                    default: true,
                },
                requireSpecialChars: {
                    type: Boolean,
                    default: false,
                },
            },
        },
        // Owner and admins
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // Status
        isActive: {
            type: Boolean,
            default: true,
        },
        verifiedDomain: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
organizationSchema.index({ slug: 1 });
organizationSchema.index({ domain: 1 });
organizationSchema.index({ owner: 1 });

// Virtual for member count
organizationSchema.virtual('memberCount', {
    ref: 'User',
    localField: '_id',
    foreignField: 'organization',
    count: true,
});

// Method to check if user is admin
organizationSchema.methods.isAdmin = function (userId) {
    return (
        this.owner.toString() === userId.toString() ||
        this.admins.some((admin) => admin.toString() === userId.toString())
    );
};

// Method to add admin
organizationSchema.methods.addAdmin = async function (userId) {
    if (!this.admins.includes(userId)) {
        this.admins.push(userId);
        await this.save();
    }
    return this;
};

// Method to remove admin
organizationSchema.methods.removeAdmin = async function (userId) {
    this.admins = this.admins.filter((admin) => admin.toString() !== userId.toString());
    await this.save();
    return this;
};

// Static method to find by domain
organizationSchema.statics.findByDomain = function (domain) {
    return this.findOne({ domain: domain.toLowerCase(), isActive: true });
};

// Static method to find by email domain
organizationSchema.statics.findByEmailDomain = function (email) {
    const domain = email.split('@')[1];
    return this.findOne({ domain: domain.toLowerCase(), isActive: true });
};

module.exports = mongoose.model('Organization', organizationSchema);
