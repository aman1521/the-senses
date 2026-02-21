/**
 * @thesenses/core
 * Shared core logic for The Senses platform.
 */

// Export modules
const exported = {
    // Ranking
    ...require('./ranking/archetype'),
    ...require('./ranking/trust'),

    // Scoring
    ...require('./scoring/insights'),

    // Test Logic (State Machine)
    testMachine: require('./test/testMachine'),

    // Validation
    ...require('./validation/evaluationSchema'),

    // Data
    ...require('./data/jobProfiles'),
};

module.exports = exported;
// CJS interop for ESM default import
module.exports.default = exported;
// Convenient alias
module.exports.jobProfiles = exported.JOB_PROFILES;
