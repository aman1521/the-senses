// Backend/data/jobProfiles.js
let core = {};
try {
    core = require("@thesenses/core");
} catch (e) {
    console.warn("⚠️ @thesenses/core not found, utilizing local Fallback Profiles.");
}

const FALLBACK_PROFILES = [
    { id: "software-engineer", name: "Software Engineer", category: "engineering", description: "Design, develop, and maintain software.", skills: ["JavaScript", "Python", "System Design"], icon: "code", color: "blue" },
    { id: "product-manager", name: "Product Manager", category: "product", description: "Drive product vision and strategy.", skills: ["Strategy", "Roadmap", "Analytics"], icon: "tasks", color: "green" },
    { id: "data-scientist", name: "Data Scientist", category: "data", description: "Analyze complex data to drive decisions.", skills: ["Python", "Machine Learning", "Statistics"], icon: "database", color: "purple" },
    { id: "digital-marketer", name: "Digital Marketer", category: "marketing", description: "Execute online marketing strategies.", skills: ["SEO", "Content", "Analytics"], icon: "bullhorn", color: "orange" },
    { id: "ux-designer", name: "UX Designer", category: "design", description: "Design intuitive user experiences.", skills: ["Figma", "User Research", "Prototyping"], icon: "pen-nib", color: "pink" }
];

const JOB_PROFILES = core.JOB_PROFILES || FALLBACK_PROFILES;

const getProfileById = core.getProfileById || ((id) => JOB_PROFILES.find(p => p.id === id));
const getProfilesByCategory = core.getProfilesByCategory || ((category) => JOB_PROFILES.filter(p => p.category === category));
const getAllActiveProfiles = core.getAllActiveProfiles || (() => JOB_PROFILES);
const getProfileCategories = core.getProfileCategories || (() => [...new Set(JOB_PROFILES.map(p => p.category))]);

module.exports = {
    JOB_PROFILES,
    getProfileById,
    getProfilesByCategory,
    getAllActiveProfiles,
    getProfileCategories
};
