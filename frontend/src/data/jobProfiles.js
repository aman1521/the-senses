// data/jobProfiles.js
// Professional Job Profile Definitions
// Synced from Backend/data/jobProfiles.js

export const JOB_PROFILES = [
    // ==================== TECHNOLOGY PROFILES ====================
    {
        id: "software-engineer",
        name: "Software Engineer",
        category: "Technology",
        description: "Designs, develops, and maintains software applications",
        skills: ["Algorithms & Data Structures", "System Design", "Code Optimization", "Debugging", "Software Architecture"],
        questionTopics: ["Algorithm Complexity", "Data Structure Selection", "System Design Patterns", "Code Quality & Best Practices", "Problem Solving"],
        difficulty: "medium",
        icon: "fa-laptop-code",
        color: "#3B82F6",
        active: true
    },
    {
        id: "data-scientist",
        name: "Data Scientist",
        category: "Technology",
        description: "Analyzes complex data to drive business decisions",
        skills: ["Statistical Analysis", "Machine Learning", "Data Visualization", "Python/R Programming", "Hypothesis Testing"],
        questionTopics: ["Statistical Inference", "ML Model Selection", "Data Interpretation", "Feature Engineering", "Experimental Design"],
        difficulty: "hard",
        icon: "fa-chart-pie",
        color: "#8B5CF6",
        active: true
    },
    {
        id: "frontend-developer",
        name: "Frontend Developer",
        category: "Technology",
        description: "Creates user interfaces and web experiences",
        skills: ["HTML/CSS/JavaScript", "React/Vue/Angular", "UI/UX Principles", "Performance Optimization", "Responsive Design"],
        questionTopics: ["Component Architecture", "State Management", "Browser Compatibility", "Performance Optimization", "Accessibility"],
        difficulty: "medium",
        icon: "fa-palette",
        color: "#EC4899",
        active: true
    },
    {
        id: "backend-developer",
        name: "Backend Developer",
        category: "Technology",
        description: "Builds server-side logic and database systems",
        skills: ["API Design", "Database Management", "Server Architecture", "Security", "Scalability"],
        questionTopics: ["RESTful API Design", "Database Optimization", "Authentication & Authorization", "Caching Strategies", "Microservices"],
        difficulty: "medium",
        icon: "fa-server",
        color: "#10B981",
        active: true
    },
    {
        id: "devops-engineer",
        name: "DevOps Engineer",
        category: "Technology",
        description: "Manages infrastructure and deployment pipelines",
        skills: ["CI/CD Pipelines", "Cloud Platforms", "Container Orchestration", "Infrastructure as Code", "Monitoring"],
        questionTopics: ["Deployment Strategies", "Container Management", "Cloud Architecture", "Automation", "Incident Response"],
        difficulty: "hard",
        icon: "fa-wrench",
        color: "#F59E0B",
        active: true
    },
    {
        id: "full-stack-developer",
        name: "Full Stack Developer",
        category: "Technology",
        description: "Works on both frontend and backend development",
        skills: ["Frontend & Backend", "Database Design", "API Integration", "Version Control", "Testing"],
        questionTopics: ["End-to-End Development", "API Design", "Database Optimization", "Frontend Frameworks", "DevOps Basics"],
        difficulty: "medium",
        icon: "fa-globe",
        color: "#06B6D4",
        active: true
    },
    {
        id: "mobile-developer",
        name: "Mobile Developer",
        category: "Technology",
        description: "Develops applications for mobile platforms",
        skills: ["iOS/Android Development", "Mobile UI/UX", "Performance Optimization", "API Integration", "App Store Deployment"],
        questionTopics: ["Mobile Architecture", "Platform-Specific Features", "Performance", "User Experience", "Cross-Platform Development"],
        difficulty: "medium",
        icon: "fa-mobile-screen",
        color: "#A855F7",
        active: true
    },
    {
        id: "ai-ml-engineer",
        name: "AI/ML Engineer",
        category: "Technology",
        description: "Develops and deploys machine learning models",
        skills: ["Deep Learning", "Model Training", "Feature Engineering", "MLOps", "Neural Networks"],
        questionTopics: ["Model Selection", "Training Optimization", "Deployment Strategies", "Data Preprocessing", "Model Evaluation"],
        difficulty: "hard",
        icon: "fa-robot",
        color: "#7C3AED",
        active: true
    },
    {
        id: "cybersecurity-specialist",
        name: "Cybersecurity Specialist",
        category: "Technology",
        description: "Protects systems and data from security threats",
        skills: ["Threat Analysis", "Penetration Testing", "Security Protocols", "Incident Response", "Compliance"],
        questionTopics: ["Security Vulnerabilities", "Risk Assessment", "Encryption", "Network Security", "Incident Management"],
        difficulty: "hard",
        icon: "fa-shield-halved",
        color: "#EF4444",
        active: true
    },
    {
        id: "cloud-architect",
        name: "Cloud Architect",
        category: "Technology",
        description: "Designs and manages cloud infrastructure",
        skills: ["AWS/Azure/GCP", "Cloud Security", "Cost Optimization", "Scalability", "Migration Strategies"],
        questionTopics: ["Cloud Design Patterns", "Service Selection", "Cost Management", "Security Best Practices", "High Availability"],
        difficulty: "hard",
        icon: "fa-cloud",
        color: "#0EA5E9",
        active: true
    },

    // ==================== BUSINESS PROFILES ====================
    {
        id: "product-manager",
        name: "Product Manager",
        category: "Business",
        description: "Defines product strategy and roadmap",
        skills: ["Product Strategy", "User Research", "Prioritization", "Stakeholder Management", "Data-Driven Decisions"],
        questionTopics: ["Feature Prioritization", "User Story Analysis", "Market Strategy", "Trade-off Decisions", "Roadmap Planning"],
        difficulty: "medium",
        icon: "fa-cubes",
        color: "#6366F1",
        active: true
    },
    {
        id: "project-manager",
        name: "Project Manager",
        category: "Business",
        description: "Plans and executes projects to completion",
        skills: ["Project Planning", "Risk Management", "Team Coordination", "Budget Management", "Agile/Scrum"],
        questionTopics: ["Resource Allocation", "Timeline Estimation", "Risk Mitigation", "Team Dynamics", "Scope Management"],
        difficulty: "medium",
        icon: "fa-list-check",
        color: "#14B8A6",
        active: true
    },
    {
        id: "business-analyst",
        name: "Business Analyst",
        category: "Business",
        description: "Analyzes business processes and requirements",
        skills: ["Requirements Gathering", "Process Mapping", "Data Analysis", "Stakeholder Communication", "Solution Design"],
        questionTopics: ["Requirement Analysis", "Process Optimization", "Data Interpretation", "Business Case Development", "Gap Analysis"],
        difficulty: "medium",
        icon: "fa-chart-line",
        color: "#0EA5E9",
        active: true
    },
    {
        id: "marketing-manager",
        name: "Marketing Manager",
        category: "Business",
        description: "Develops and executes marketing strategies",
        skills: ["Marketing Strategy", "Brand Management", "Campaign Planning", "Analytics", "Customer Segmentation"],
        questionTopics: ["Campaign Optimization", "Target Audience Analysis", "Brand Positioning", "ROI Calculation", "Channel Selection"],
        difficulty: "medium",
        icon: "fa-bullhorn",
        color: "#F97316",
        active: true
    },
    {
        id: "sales-executive",
        name: "Sales Executive",
        category: "Business",
        description: "Drives revenue through customer relationships",
        skills: ["Negotiation", "Relationship Building", "Pipeline Management", "Closing Techniques", "CRM Management"],
        questionTopics: ["Objection Handling", "Deal Prioritization", "Customer Psychology", "Value Proposition", "Sales Strategy"],
        difficulty: "medium",
        icon: "fa-briefcase",
        color: "#EF4444",
        active: true
    },
    {
        id: "entrepreneur",
        name: "Entrepreneur/Founder",
        category: "Business",
        description: "Builds and scales businesses from scratch",
        skills: ["Strategic Thinking", "Resource Management", "Risk Assessment", "Innovation", "Leadership"],
        questionTopics: ["Business Model Design", "Market Opportunity", "Fundraising Strategy", "Team Building", "Pivot Decisions"],
        difficulty: "hard",
        icon: "fa-rocket",
        color: "#A855F7",
        active: true
    },

    // CREATIVE PROFILES
    {
        id: "ux-ui-designer",
        name: "UX/UI Designer",
        category: "Creative",
        description: "Designs user experiences and interfaces",
        skills: ["User Research", "Wireframing", "Prototyping", "Visual Design", "Usability Testing"],
        questionTopics: ["Design Principles", "User Flow Optimization", "Accessibility", "Design Systems", "User Psychology"],
        difficulty: "medium",
        icon: "fa-pen-ruler",
        color: "#EC4899",
        active: true
    },
    {
        id: "content-writer",
        name: "Content Writer",
        category: "Creative",
        description: "Creates engaging written content",
        skills: ["Copywriting", "SEO", "Storytelling", "Editing", "Audience Analysis"],
        questionTopics: ["Tone & Voice", "Content Strategy", "Engagement Optimization", "SEO Best Practices", "Narrative Structure"],
        difficulty: "medium",
        icon: "fa-pen-fancy",
        color: "#10B981",
        active: true
    },
    {
        id: "graphic-designer",
        name: "Graphic Designer",
        category: "Creative",
        description: "Creates visual content for brands and media",
        skills: ["Visual Design", "Typography", "Color Theory", "Adobe Creative Suite", "Brand Identity"],
        questionTopics: ["Design Principles", "Visual Hierarchy", "Brand Consistency", "Creative Problem Solving", "Client Communication"],
        difficulty: "medium",
        icon: "fa-palette",
        color: "#F472B6",
        active: true
    },
    {
        id: "video-editor",
        name: "Video Editor",
        category: "Creative",
        description: "Edits and produces video content",
        skills: ["Video Editing", "Motion Graphics", "Color Grading", "Audio Mixing", "Storytelling"],
        questionTopics: ["Editing Techniques", "Pacing & Rhythm", "Visual Effects", "Audio Synchronization", "Project Management"],
        difficulty: "medium",
        icon: "fa-film",
        color: "#FB923C",
        active: true
    },

    // ==================== FINANCE & ACCOUNTING ====================
    {
        id: "financial-analyst",
        name: "Financial Analyst",
        category: "Finance",
        description: "Analyzes financial data and provides insights",
        skills: ["Financial Modeling", "Data Analysis", "Forecasting", "Excel/SQL", "Risk Assessment"],
        questionTopics: ["Financial Ratios", "Valuation Methods", "Market Analysis", "Investment Decisions", "Risk Management"],
        difficulty: "hard",
        icon: "fa-coins",
        color: "#10B981",
        active: true
    },
    {
        id: "accountant",
        name: "Accountant",
        category: "Finance",
        description: "Manages financial records and compliance",
        skills: ["Bookkeeping", "Tax Preparation", "Financial Reporting", "Audit", "Compliance"],
        questionTopics: ["Accounting Principles", "Tax Regulations", "Financial Statements", "Audit Procedures", "Compliance Standards"],
        difficulty: "medium",
        icon: "fa-calculator",
        color: "#059669",
        active: true
    },
    {
        id: "investment-banker",
        name: "Investment Banker",
        category: "Finance",
        description: "Facilitates financial transactions and deals",
        skills: ["Deal Structuring", "Financial Modeling", "Valuation", "Client Relations", "Market Analysis"],
        questionTopics: ["M&A Transactions", "Capital Raising", "Valuation Techniques", "Market Dynamics", "Deal Negotiation"],
        difficulty: "hard",
        icon: "fa-building-columns",
        color: "#047857",
        active: true
    },

    // ==================== HEALTHCARE ====================
    {
        id: "healthcare-professional",
        name: "Healthcare Professional",
        category: "Healthcare",
        description: "Provides medical care and health services",
        skills: ["Clinical Knowledge", "Patient Care", "Diagnosis", "Treatment Planning", "Medical Ethics"],
        questionTopics: ["Clinical Reasoning", "Patient Assessment", "Treatment Options", "Medical Ethics", "Emergency Response"],
        difficulty: "hard",
        icon: "fa-staff-snake",
        color: "#DC2626",
        active: true
    },
    {
        id: "nurse",
        name: "Registered Nurse",
        category: "Healthcare",
        description: "Provides patient care and medical support",
        skills: ["Patient Care", "Clinical Skills", "Communication", "Emergency Response", "Care Coordination"],
        questionTopics: ["Patient Assessment", "Care Planning", "Medication Administration", "Emergency Protocols", "Patient Education"],
        difficulty: "medium",
        icon: "fa-user-nurse",
        color: "#EF4444",
        active: true
    },

    // ==================== LEGAL ====================
    {
        id: "lawyer",
        name: "Lawyer/Attorney",
        category: "Legal",
        description: "Provides legal counsel and representation",
        skills: ["Legal Research", "Case Analysis", "Argumentation", "Contract Law", "Litigation"],
        questionTopics: ["Legal Reasoning", "Case Law Analysis", "Contract Interpretation", "Ethical Dilemmas", "Litigation Strategy"],
        difficulty: "hard",
        icon: "fa-scale-balanced",
        color: "#1E40AF",
        active: true
    },
    {
        id: "paralegal",
        name: "Paralegal",
        category: "Legal",
        description: "Assists lawyers with legal work",
        skills: ["Legal Research", "Document Preparation", "Case Management", "Client Communication", "Compliance"],
        questionTopics: ["Legal Documentation", "Research Methods", "Case Organization", "Legal Procedures", "Client Relations"],
        difficulty: "medium",
        icon: "fa-scroll",
        color: "#3B82F6",
        active: true
    },

    // ==================== EDUCATION ====================
    {
        id: "teacher",
        name: "Teacher/Educator",
        category: "Education",
        description: "Educates and mentors students",
        skills: ["Curriculum Design", "Classroom Management", "Student Assessment", "Communication", "Pedagogy"],
        questionTopics: ["Teaching Methods", "Student Engagement", "Assessment Strategies", "Classroom Dynamics", "Learning Styles"],
        difficulty: "medium",
        icon: "fa-chalkboard-user",
        color: "#F59E0B",
        active: true
    },
    {
        id: "instructional-designer",
        name: "Instructional Designer",
        category: "Education",
        description: "Designs educational programs and materials",
        skills: ["Learning Theory", "Course Design", "E-Learning Tools", "Assessment Design", "Multimedia Production"],
        questionTopics: ["Learning Objectives", "Course Structure", "Engagement Strategies", "Assessment Methods", "Technology Integration"],
        difficulty: "medium",
        icon: "fa-book-open",
        color: "#D97706",
        active: true
    },

    // ==================== OPERATIONS & LOGISTICS ====================
    {
        id: "operations-manager",
        name: "Operations Manager",
        category: "Operations",
        description: "Manages day-to-day business operations",
        skills: ["Process Optimization", "Resource Management", "Quality Control", "Team Leadership", "Performance Metrics"],
        questionTopics: ["Operational Efficiency", "Resource Allocation", "Process Improvement", "Team Management", "KPI Tracking"],
        difficulty: "medium",
        icon: "fa-gears",
        color: "#6366F1",
        active: true
    },
    {
        id: "supply-chain-manager",
        name: "Supply Chain Manager",
        category: "Operations",
        description: "Manages supply chain and logistics",
        skills: ["Logistics Planning", "Inventory Management", "Vendor Relations", "Cost Optimization", "Risk Management"],
        questionTopics: ["Supply Chain Optimization", "Inventory Control", "Vendor Management", "Cost Reduction", "Risk Mitigation"],
        difficulty: "medium",
        icon: "fa-truck",
        color: "#8B5CF6",
        active: true
    },

    // ==================== HR & RECRUITMENT ====================
    {
        id: "hr-manager",
        name: "HR Manager",
        category: "Human Resources",
        description: "Manages human resources and talent",
        skills: ["Talent Acquisition", "Employee Relations", "Performance Management", "Compliance", "Organizational Development"],
        questionTopics: ["Recruitment Strategies", "Employee Engagement", "Performance Reviews", "Conflict Resolution", "HR Policies"],
        difficulty: "medium",
        icon: "fa-users",
        color: "#EC4899",
        active: true
    },
    {
        id: "recruiter",
        name: "Recruiter/Talent Acquisition",
        category: "Human Resources",
        description: "Sources and hires top talent",
        skills: ["Candidate Sourcing", "Interviewing", "Assessment", "Negotiation", "Employer Branding"],
        questionTopics: ["Candidate Evaluation", "Interview Techniques", "Offer Negotiation", "Talent Pipeline", "Hiring Metrics"],
        difficulty: "medium",
        icon: "fa-bullseye",
        color: "#F472B6",
        active: true
    },

    // ==================== RESEARCH & SCIENCE ====================
    {
        id: "researcher",
        name: "Researcher/Scientist",
        category: "Research",
        description: "Conducts scientific research and experiments",
        skills: ["Research Design", "Data Analysis", "Hypothesis Testing", "Scientific Writing", "Critical Thinking"],
        questionTopics: ["Research Methodology", "Experimental Design", "Data Interpretation", "Literature Review", "Scientific Reasoning"],
        difficulty: "hard",
        icon: "fa-flask",
        color: "#0EA5E9",
        active: true
    },
    {
        id: "data-analyst",
        name: "Data Analyst",
        category: "Technology",
        description: "Analyzes data to derive business insights",
        skills: ["SQL", "Data Visualization", "Statistical Analysis", "Excel", "Business Intelligence"],
        questionTopics: ["Data Cleaning", "Statistical Methods", "Visualization Techniques", "Business Metrics", "Reporting"],
        difficulty: "medium",
        icon: "fa-chart-column",
        color: "#06B6D4",
        active: true
    },

    // ==================== CUSTOMER SERVICE ====================
    {
        id: "customer-success-manager",
        name: "Customer Success Manager",
        category: "Customer Service",
        description: "Ensures customer satisfaction and retention",
        skills: ["Customer Relations", "Problem Solving", "Communication", "Product Knowledge", "Account Management"],
        questionTopics: ["Customer Onboarding", "Issue Resolution", "Customer Retention", "Upselling", "Feedback Management"],
        difficulty: "medium",
        icon: "fa-handshake",
        color: "#10B981",
        active: true
    },

    {
        id: "psychology-assessment",
        name: "Psychology Assessment",
        category: "Assessment",
        description: "Evaluates personality traits, emotional intelligence, and behavioral patterns",
        skills: ["Emotional Intelligence", "Self-Awareness", "Social Cognition", "Stress Management", "Decision Making"],
        questionTopics: [
            "Personality Traits (Big Five)",
            "Emotional Response Patterns",
            "Work Style Preferences",
            "Leadership Tendencies",
            "Conflict Resolution Approaches",
            "Team Collaboration Style",
            "Stress and Pressure Handling",
            "Motivation and Drive",
            "Communication Preferences",
            "Risk Tolerance"
        ],
        difficulty: "medium",
        icon: "fa-masks-theater",
        color: "#9333EA",
        active: true,
        isPsychologyTest: true,
        questionFormat: "scenario-based"
    },
    {
        id: "general",
        name: "General Intelligence",
        category: "General",
        description: "Broad cognitive ability assessment",
        skills: ["Logical Reasoning", "Pattern Recognition", "Problem Solving", "Critical Thinking", "Decision Making"],
        questionTopics: ["Logic Puzzles", "Pattern Analysis", "Verbal Reasoning", "Numerical Reasoning", "Abstract Thinking"],
        difficulty: "medium",
        icon: "fa-brain",
        color: "#6B7280",
        active: true
    }
];

export const getProfileById = (id) => {
    return JOB_PROFILES.find(profile => profile.id === id);
};

export const getProfilesByCategory = (category) => {
    return JOB_PROFILES.filter(profile => profile.category === category);
};

export const getAllActiveProfiles = () => {
    return JOB_PROFILES.filter(profile => profile.active);
};

export const getProfileCategories = () => {
    return [...new Set(JOB_PROFILES.map(profile => profile.category))];
};
