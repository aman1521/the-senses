const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema(
    {
        // Company Header
        name: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
            index: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        logo: {
            type: String,
            default: null,
        },
        industry: {
            type: String,
            required: [true, 'Industry is required'],
            index: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        companyCognitiveIndex: {
            type: Number,
            default: 0,
            index: true, // Average of all employees
        },
        location: {
            city: String,
            country: String,
            headquarters: String,
        },
        website: {
            type: String,
            trim: true,
        },

        // About Company
        description: {
            type: String,
            maxlength: 2000,
        },
        size: {
            type: String,
            enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
        },
        foundedYear: {
            type: Number,
            min: 1800,
            max: new Date().getFullYear(),
        },
        hiringStatus: {
            type: String,
            enum: ['actively-hiring', 'selective', 'not-hiring'],
            default: 'not-hiring',
        },

        // Admin & Access Control
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
        recruiters: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                },
                permissions: {
                    canViewCandidates: { type: Boolean, default: true },
                    canInviteCandidates: { type: Boolean, default: true },
                    canCreateJobs: { type: Boolean, default: false },
                    canManageTests: { type: Boolean, default: false },
                },
            },
        ],

        // Hiring Dashboard
        activeJobRoles: [
            {
                title: String,
                description: String,
                department: String,
                requiredThinkingScoreMin: { type: Number, default: 0 },
                requiredThinkingScoreMax: { type: Number, default: 1000 },
                requiredSkills: [String],
                experienceLevel: {
                    type: String,
                    enum: ['intern', 'junior', 'mid', 'senior', 'executive'],
                },
                employmentType: {
                    type: String,
                    enum: ['full-time', 'part-time', 'contract', 'internship'],
                    default: 'full-time',
                },
                location: String,
                remote: Boolean,
                salaryRange: {
                    min: Number,
                    max: Number,
                    currency: { type: String, default: 'USD' },
                },
                postedAt: {
                    type: Date,
                    default: Date.now,
                },
                status: {
                    type: String,
                    enum: ['draft', 'active', 'paused', 'closed'],
                    default: 'draft',
                },
                applicantsCount: {
                    type: Number,
                    default: 0,
                },
            },
        ],

        // Employee Cognitive Overview
        employeeMetrics: {
            averageTeamScore: { type: Number, default: 0 },
            totalEmployees: { type: Number, default: 0 },
            topPerformers: [
                {
                    userId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                    score: Number,
                    name: String,
                    position: String,
                },
            ],
            skillHeatmap: {
                type: Map,
                of: Number, // e.g. { "JavaScript": 85, "React": 78, "Python": 92 }
                default: {},
            },
            departmentScores: {
                type: Map,
                of: Number, // e.g. { "Engineering": 850, "Marketing": 780 }
                default: {},
            },
        },

        // Company Challenges
        customChallenges: [
            {
                title: String,
                description: String,
                difficulty: {
                    type: String,
                    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                },
                isPublic: { type: Boolean, default: false },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                attemptCount: {
                    type: Number,
                    default: 0,
                },
                questionIds: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Question',
                    },
                ],
            },
        ],

        // Recruiter Panel Filters (Saved Searches)
        savedSearches: [
            {
                name: String,
                filters: {
                    profession: [String],
                    globalRankMin: Number,
                    globalRankMax: Number,
                    percentileMin: Number,
                    percentileMax: Number,
                    thinkingScoreMin: Number,
                    thinkingScoreMax: Number,
                    skills: [String],
                    experienceLevel: [String],
                    location: [String],
                    openToHiring: Boolean,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // Candidate Invitations & Applications
        candidates: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                jobRoleId: mongoose.Schema.Types.ObjectId, // Links to activeJobRoles
                status: {
                    type: String,
                    enum: ['invited', 'applied', 'screening', 'interview', 'offered', 'rejected', 'hired'],
                    default: 'invited',
                },
                invitedAt: Date,
                appliedAt: Date,
                thinkingScore: Number,
                notes: String,
                recruiterNotes: [
                    {
                        recruiterId: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'User',
                        },
                        note: String,
                        createdAt: {
                            type: Date,
                            default: Date.now,
                        },
                    },
                ],
            },
        ],

        // Company Settings
        settings: {
            allowPublicApplications: { type: Boolean, default: true },
            requireMinimumScore: { type: Boolean, default: false },
            minimumScoreThreshold: { type: Number, default: 600 },
            autoInviteTopPercentile: { type: Boolean, default: false },
            autoInvitePercentileThreshold: { type: Number, default: 90 },
        },

        // Branding
        branding: {
            primaryColor: { type: String, default: '#6366f1' },
            bannerImage: String,
            tagline: String,
            culture: {
                values: [String],
                perks: [String],
            },
        },

        // Social & Contact
        socialLinks: {
            linkedin: String,
            twitter: String,
            facebook: String,
            instagram: String,
        },
        contactEmail: String,

        // Subscription & Billing
        subscription: {
            plan: {
                type: String,
                enum: ['free', 'starter', 'growth', 'enterprise'],
                default: 'free',
            },
            status: {
                type: String,
                enum: ['active', 'trial', 'cancelled', 'suspended'],
                default: 'trial',
            },
            jobPostingsLimit: { type: Number, default: 1 }, // Free plan: 1 job
            candidateSearchesPerMonth: { type: Number, default: 10 },
            activeRecruitersLimit: { type: Number, default: 1 },
            trialEndsAt: Date,
            billingCycle: {
                type: String,
                enum: ['monthly', 'yearly'],
            },
            stripeCustomerId: String,
            stripeSubscriptionId: String,
        },

        // Analytics & Tracking
        analytics: {
            profileViews: { type: Number, default: 0 },
            jobPostViews: { type: Number, default: 0 },
            totalInvitesSent: { type: Number, default: 0 },
            totalApplicationsReceived: { type: Number, default: 0 },
            avgResponseTime: Number, // in hours
            hireRate: Number, // percentage
        },

        // Status
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
companyProfileSchema.index({ slug: 1 });
companyProfileSchema.index({ industry: 1 });
companyProfileSchema.index({ companyCognitiveIndex: -1 }); // For ranking
companyProfileSchema.index({ 'activeJobRoles.status': 1 });
companyProfileSchema.index({ owner: 1 });

// Virtual for public profile URL
companyProfileSchema.virtual('publicUrl').get(function () {
    return `/company/${this.slug}`;
});

// Method to check if user is admin
companyProfileSchema.methods.isAdmin = function (userId) {
    return (
        this.owner.toString() === userId.toString() ||
        this.admins.some((admin) => admin.toString() === userId.toString())
    );
};

// Method to check if user is recruiter
companyProfileSchema.methods.isRecruiter = function (userId) {
    return this.recruiters.some((recruiter) => recruiter.userId.toString() === userId.toString());
};

// Method to add recruiter
companyProfileSchema.methods.addRecruiter = async function (userId, permissions = {}) {
    const existingRecruiter = this.recruiters.find(
        (r) => r.userId.toString() === userId.toString()
    );

    if (existingRecruiter) {
        throw new Error('User is already a recruiter');
    }

    this.recruiters.push({
        userId,
        permissions: {
            canViewCandidates: permissions.canViewCandidates !== false,
            canInviteCandidates: permissions.canInviteCandidates !== false,
            canCreateJobs: permissions.canCreateJobs || false,
            canManageTests: permissions.canManageTests || false,
        },
    });

    await this.save();
    return this;
};

// Method to calculate company cognitive index
companyProfileSchema.methods.calculateCognitiveIndex = async function () {
    const User = mongoose.model('User');

    // Find all users associated with this company
    const employees = await User.find({
        company: this._id,
    }).select('globalThinkingScore');

    if (employees.length === 0) {
        this.companyCognitiveIndex = 0;
        this.employeeMetrics.totalEmployees = 0;
        await this.save();
        return;
    }

    // Calculate average
    const totalScore = employees.reduce((sum, emp) => sum + (emp.globalThinkingScore || 0), 0);
    this.companyCognitiveIndex = Math.round(totalScore / employees.length);
    this.employeeMetrics.totalEmployees = employees.length;
    this.employeeMetrics.averageTeamScore = this.companyCognitiveIndex;

    await this.save();
    return this.companyCognitiveIndex;
};

// Static method to find by slug
companyProfileSchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

// Static method to search companies
companyProfileSchema.statics.searchCompanies = function (query) {
    const { industry, size, location, hiringStatus, minScore } = query;

    const filter = { isActive: true };

    if (industry) filter.industry = industry;
    if (size) filter.size = size;
    if (location) filter['location.country'] = location;
    if (hiringStatus) filter.hiringStatus = hiringStatus;
    if (minScore) filter.companyCognitiveIndex = { $gte: minScore };

    return this.find(filter)
        .select('name slug logo industry companyCognitiveIndex location hiringStatus')
        .sort({ companyCognitiveIndex: -1 });
};

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
