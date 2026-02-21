const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Identity
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, index: true },
  username: { type: String, unique: true, sparse: true, trim: true }, // Public Handle
  password: { type: String, select: false }, // Hide by default
  role: {
    type: String,
    enum: ['user', 'admin', 'company_admin'],
    default: 'user'
  },

  // Professional Profile
  profileType: { type: String, index: true }, // e.g. "software-engineer"
  experienceLevel: { type: String, default: 'mid' }, // intern, junior, mid, senior, executive
  profileHeadline: String, // e.g. "Senior React Developer"
  profilePicture: String, // URL to profile image
  bio: String, // AI-generated bio based on interview

  skills: [String], // List of specific skills e.g. ["React", "Node.js", "AWS"]
  skillsMetadata: {
    type: Map,
    of: Number, // Stores confidence/weight: { "React": 0.9, "AWS": 0.6 }
    default: {}
  },

  onboardingCompleted: { type: Boolean, default: false }, // Has the user done the initial AI interview?

  // OAuth Fields
  oauthProvider: { type: String }, // 'google' or 'linkedin'
  oauthId: { type: String }, // Provider's user ID

  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  location: String,

  // Organization & Team (B2B Features)
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true,
  },
  organizationRole: {
    type: String,
    enum: ['owner', 'admin', 'member', 'analyst'],
    default: 'member',
  },
  teams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
  ],

  // SSO Fields
  ssoProvider: {
    type: String,
    enum: ['saml', 'google', 'azure', 'okta', null],
    default: null,
  },
  ssoId: String, // Unique ID from SSO provider
  ssoMetadata: {
    type: Map,
    of: String, // Additional SSO provider data
    default: {},
  },

  // Gamification & Stats
  bestScoreEver: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  testsTaken: { type: Number, default: 0 },
  seasonScore: { type: Number, default: 0 },

  stats: {
    strengthAreas: [String], // e.g. ["Algorithms", "System Design"]
    weakAreas: [String],
    percentile: { type: Number, default: 0 }
  },

  trustLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'high'
  },
  humanLikelihood: { type: Number, default: 100 },

  // History
  lastTestDate: Date,
  history: [{
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'IntelligenceResult' },
    score: Number,
    profileType: String,
    date: { type: Date, default: Date.now }
  }],

  // Preferences
  preferences: {
    theme: { type: String, default: 'dark' },
    publicProfile: { type: Boolean, default: true }
  },

  // Payment & Membership
  membership: {
    status: { type: String, enum: ['free', 'premium'], default: 'free' },
    plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
    expiresAt: Date,
    stripeCustomerId: String
  },

  // ==== COMPLETE PROFILE SYSTEM ====

  // Profile Header
  verified: { type: Boolean, default: false }, // AI Verified badge
  globalThinkingScore: { type: Number, default: 0, index: true }, // Main cognitive score
  profession: String, // e.g. "Marketing Strategist"
  globalRank: { type: Number, index: true }, // Absolute rank number
  globalRankPercentile: { type: Number }, // e.g. 97 means "Top 3%"
  country: String,
  isPublic: { type: Boolean, default: true }, // Public/Private profile toggle

  // About Section (Enhanced)
  yearsOfExperience: { type: Number, default: 0 },
  // skills and bio already exist above
  // skillsMetadata already exists

  // Thinking Metrics Section
  thinkingMetrics: {
    overallCognitiveScore: { type: Number, default: 0 },

    // Cultural Indicators (Strategic Features)
    debateWinRate: { type: Number, default: 0 }, // Gamified Intellectual Combat
    insightContributionScore: { type: Number, default: 0 }, // Value added
    reasoningClarityRating: { type: Number, default: 0 }, // AI-rated
    intellectualInfluenceScore: { type: Number, default: 0, index: true }, // Gravity

    domainScores: {
      type: Map,
      of: Number, // e.g. { "marketing": 850, "analytics": 780 }
      default: {}
    },
    strengthRadarData: {
      problemSolvingSpeed: { type: Number, default: 0, max: 100 },
      analyticalDepth: { type: Number, default: 0, max: 100 },
      creativityIndex: { type: Number, default: 0, max: 100 },
      logicalReasoning: { type: Number, default: 0, max: 100 },
      criticalThinking: { type: Number, default: 0, max: 100 },
      patternRecognition: { type: Number, default: 0, max: 100 }
    },
    difficultyLevelCompleted: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },

  // Test History & Progression
  scoreProgression: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'IntelligenceResult' },
    score: Number,
    date: Date,
    difficulty: String,
    antiCheatVerified: Boolean
  }],

  // Detailed Rank History (for Ranking Tab)
  rankHistory: [{
    date: { type: Date, default: Date.now },
    rank: Number,
    percentile: Number,
    globalScore: Number
  }],

  // Certifications
  certifications: [{
    title: { type: String, required: true },
    organization: { type: String, required: true },
    issueDate: Date,
    credentialId: String,
    credentialUrl: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Achievements & Badges
  achievements: {
    badges: [{
      badgeId: String, // e.g. "first-test", "speed-demon", "top-percentile"
      name: String,
      description: String,
      icon: String,
      earnedAt: Date
    }],
    rankMilestones: [{
      rank: Number,
      achievedAt: Date,
      title: String // e.g. "Top 1000", "Elite 100"
    }],
    industryPercentile: {
      type: Map,
      of: Number, // e.g. { "tech": 95, "marketing": 88 }
      default: {}
    }
  },

  // Hiring Visibility Settings
  hiringSettings: {
    openToHiring: { type: Boolean, default: false },
    recruiterAccessEnabled: { type: Boolean, default: false },
    resumeUrl: String,
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String,
    expectedSalaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    preferredJobTypes: [String], // e.g. ["full-time", "contract", "remote"]
    preferredLocations: [String]
  },

  // Activity Tracking
  activity: {
    lastActive: Date,
    testsCompleted: { type: Number, default: 0 },
    challengesAttempted: { type: Number, default: 0 },
    publicAnswersCount: { type: Number, default: 0 },
    companyInvitationsReceived: [{
      companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
      jobTitle: String,
      receivedAt: Date,
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }]
  },

  // Public Profile Settings
  publicProfileSettings: {
    showEmail: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: true },
    showTestHistory: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
    showThinkingMetrics: { type: Boolean, default: true },
    showActivity: { type: Boolean, default: false }
  },

  // Account & Notification Settings
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    testReminders: { type: Boolean, default: true },
    achievementAlerts: { type: Boolean, default: true },
    rankChangeAlerts: { type: Boolean, default: true },
    recruiterMessages: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Virtuals
userSchema.virtual('tier').get(function () {
  if (this.bestScoreEver >= 900) return 'Grandmaster';
  if (this.bestScoreEver >= 800) return 'Master';
  if (this.bestScoreEver >= 700) return 'Diamond';
  if (this.bestScoreEver >= 600) return 'Platinum';
  return 'Gold';
});

const SimpleDB = require('../utils/SimpleDB');
const UserMock = new SimpleDB('users');
const UserModel = mongoose.model('User', userSchema);

module.exports = new Proxy(UserModel, {
  get: function (target, prop) {
    if (global.USE_MOCK_DB) {
      if (prop === 'findById') return async (id) => {
        let user = await UserMock.findById(id);
        // Fallback: If specific user not found in mock, return the first available or a default
        if (!user && UserMock.data.length > 0) user = UserMock._wrapInstance(UserMock.data[0]);
        return user;
      };
      if (prop === 'find') return (query) => UserMock.find(query);
      if (prop === 'findOne') return (query) => UserMock.findOne(query);
      if (prop === 'create') return (doc) => UserMock.create(doc);
      if (prop === 'findByIdAndUpdate') return (id, update, options) => UserMock.findByIdAndUpdate(id, update, options);
    }
    return target[prop];
  },
  construct: function (target, [doc]) {
    if (global.USE_MOCK_DB) {
      const instance = { ...doc };
      instance.save = async function () {
        const saved = await UserMock.create(this);
        Object.assign(this, saved); // update self with _id
        return this;
      };
      return instance;
    }
    return new target(doc);
  }
});
