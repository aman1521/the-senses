const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

/**
 * Create company profile
 */
exports.createCompanyProfile = async (req, res) => {
    try {
        const { name, industry, description, website, location, size, foundedYear } = req.body;
        const userId = req.user._id;

        // Generate slug from company name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Check if slug already exists
        const existingCompany = await CompanyProfile.findOne({ slug });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'A company with this name already exists',
            });
        }

        const company = await CompanyProfile.create({
            name,
            slug,
            industry,
            description,
            website,
            location,
            size,
            foundedYear,
            owner: userId,
            admins: [userId],
        });

        // Update user's company reference
        await User.findByIdAndUpdate(userId, { company: company._id, role: 'company_admin' });

        res.status(201).json({
            success: true,
            message: 'Company profile created successfully',
            data: company,
        });
    } catch (error) {
        console.error('Error creating company profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create company profile',
            error: error.message,
        });
    }
};

/**
 * Get company profile by slug
 */
exports.getCompanyBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const company = await CompanyProfile.findBySlug(slug)
            .populate('owner', 'name profilePicture')
            .populate('employeeMetrics.topPerformers.userId', 'name profilePicture profession globalThinkingScore');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Get active job count
        const activeJobs = company.activeJobRoles.filter((job) => job.status === 'active');

        res.json({
            success: true,
            data: {
                ...company.toObject(),
                activeJobCount: activeJobs.length,
            },
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company profile',
            error: error.message,
        });
    }
};

/**
 * Update company profile
 */
exports.updateCompanyProfile = async (req, res) => {
    try {
        const { companyId } = req.params;
        const updates = req.body;
        const userId = req.user._id;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Check if user is admin
        if (!company.isAdmin(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only company admins can update the profile',
            });
        }

        // Allowed fields to update
        const allowedFields = [
            'name',
            'logo',
            'description',
            'website',
            'location',
            'size',
            'foundedYear',
            'hiringStatus',
            'branding',
            'socialLinks',
            'contactEmail',
            'settings',
        ];

        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key)) {
                company[key] = updates[key];
            }
        });

        await company.save();

        res.json({
            success: true,
            message: 'Company profile updated successfully',
            data: company,
        });
    } catch (error) {
        console.error('Error updating company profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update company profile',
            error: error.message,
        });
    }
};

/**
 * Create job role
 */
exports.createJobRole = async (req, res) => {
    try {
        const { companyId } = req.params;
        const jobData = req.body;
        const userId = req.user._id;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Check if user is admin or recruiter with permission
        const isAdmin = company.isAdmin(userId);
        const recruiter = company.recruiters.find((r) => r.userId.toString() === userId.toString());
        const canCreateJobs = recruiter?.permissions.canCreateJobs;

        if (!isAdmin && !canCreateJobs) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to create job roles',
            });
        }

        company.activeJobRoles.push({
            ...jobData,
            postedAt: new Date(),
        });

        await company.save();

        res.status(201).json({
            success: true,
            message: 'Job role created successfully',
            data: company.activeJobRoles[company.activeJobRoles.length - 1],
        });
    } catch (error) {
        console.error('Error creating job role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create job role',
            error: error.message,
        });
    }
};

/**
 * Get active job roles
 */
exports.getActiveJobs = async (req, res) => {
    try {
        const { companyId } = req.params;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        const activeJobs = company.activeJobRoles.filter((job) => job.status === 'active');

        res.json({
            success: true,
            data: activeJobs,
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs',
            error: error.message,
        });
    }
};

/**
 * Invite candidate to apply
 */
exports.inviteCandidate = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { userId: candidateId, jobRoleId, message } = req.body;
        const recruiterId = req.user._id;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Check permissions
        const isAdmin = company.isAdmin(recruiterId);
        const recruiter = company.recruiters.find((r) => r.userId.toString() === recruiterId.toString());
        const canInvite = recruiter?.permissions.canInviteCandidates;

        if (!isAdmin && !canInvite) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to invite candidates',
            });
        }

        // Get candidate's thinking score
        const candidate = await User.findById(candidateId).select('globalThinkingScore name email');

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found',
            });
        }

        // Check if already invited
        const existingInvite = company.candidates.find(
            (c) => c.userId.toString() === candidateId && c.jobRoleId.toString() === jobRoleId
        );

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: 'Candidate already invited for this role',
            });
        }

        // Add candidate
        company.candidates.push({
            userId: candidateId,
            jobRoleId,
            status: 'invited',
            invitedAt: new Date(),
            thinkingScore: candidate.globalThinkingScore,
        });

        company.analytics.totalInvitesSent += 1;
        await company.save();

        // Add invitation to user's activity
        await User.findByIdAndUpdate(candidateId, {
            $push: {
                'activity.companyInvitationsReceived': {
                    companyId: company._id,
                    jobTitle: company.activeJobRoles.id(jobRoleId).title,
                    receivedAt: new Date(),
                },
            },
        });

        // TODO: Send email notification
        // await sendEmail({
        //     to: candidate.email,
        //     subject: `Invitation from ${company.name}`,
        //     html: `You've been invited to apply for a position at ${company.name}...`
        // });

        res.json({
            success: true,
            message: 'Candidate invited successfully',
        });
    } catch (error) {
        console.error('Error inviting candidate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invite candidate',
            error: error.message,
        });
    }
};

/**
 * Get candidates for company
 */
exports.getCandidates = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { status, jobRoleId } = req.query;
        const userId = req.user._id;

        const company = await CompanyProfile.findById(companyId).populate(
            'candidates.userId',
            'name email profilePicture globalThinkingScore profession experienceLevel'
        );

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Check permissions
        if (!company.isAdmin(userId) && !company.isRecruiter(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        let candidates = company.candidates;

        // Filter by status
        if (status) {
            candidates = candidates.filter((c) => c.status === status);
        }

        // Filter by job role
        if (jobRoleId) {
            candidates = candidates.filter((c) => c.jobRoleId.toString() === jobRoleId);
        }

        res.json({
            success: true,
            data: candidates,
        });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch candidates',
            error: error.message,
        });
    }
};

/**
 * Update candidate status
 */
exports.updateCandidateStatus = async (req, res) => {
    try {
        const { companyId, candidateId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user._id;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Check permissions
        if (!company.isAdmin(userId) && !company.isRecruiter(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        const candidate = company.candidates.id(candidateId);

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found',
            });
        }

        candidate.status = status;
        if (notes) {
            candidate.notes = notes;
        }

        await company.save();

        res.json({
            success: true,
            message: 'Candidate status updated successfully',
            data: candidate,
        });
    } catch (error) {
        console.error('Error updating candidate status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update candidate status',
            error: error.message,
        });
    }
};

/**
 * Get employee cognitive overview
 */
exports.getEmployeeOverview = async (req, res) => {
    try {
        const { companyId } = req.params;
        const userId = req.user._id;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Check permissions
        if (!company.isAdmin(userId) && !company.isRecruiter(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }

        // Recalculate cognitive index
        await company.calculateCognitiveIndex();

        // Get top performers
        const employees = await User.find({ company: companyId })
            .sort({ globalThinkingScore: -1 })
            .limit(10)
            .select('name profilePicture profession globalThinkingScore');

        // Update top performers
        company.employeeMetrics.topPerformers = employees.map((emp) => ({
            userId: emp._id,
            score: emp.globalThinkingScore,
            name: emp.name,
            position: emp.profession,
        }));

        await company.save();

        res.json({
            success: true,
            data: company.employeeMetrics,
        });
    } catch (error) {
        console.error('Error fetching employee overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee overview',
            error: error.message,
        });
    }
};

/**
 * Add recruiter to company
 */
exports.addRecruiter = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { userId: recruiterId, permissions } = req.body;
        const adminId = req.user._id;

        const company = await CompanyProfile.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }

        // Only admins can add recruiters
        if (!company.isAdmin(adminId)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins can add recruiters',
            });
        }

        await company.addRecruiter(recruiterId, permissions);

        res.json({
            success: true,
            message: 'Recruiter added successfully',
        });
    } catch (error) {
        console.error('Error adding recruiter:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to add recruiter',
        });
    }
};

module.exports = exports;
