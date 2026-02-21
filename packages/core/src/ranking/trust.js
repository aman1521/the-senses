/**
 * Logic related to Trust Score visualization and thresholds.
 */

const TRUST_THRESHOLDS = {
    HIGH: 80,
    MEDIUM: 50
};

const TERMS = {
    VERIFIED: "Verified",
    WARNING: "Warning",
    CRITICAL: "Critical"
};

/**
 * Get the color associated with a trust score.
 * @param {number} score - The trust score (0-100)
 * @returns {string} Hex color code
 */
function getTrustColor(score) {
    if (score >= TRUST_THRESHOLDS.HIGH) return '#10b981'; // green
    if (score >= TRUST_THRESHOLDS.MEDIUM) return '#f59e0b'; // yellow
    return '#ef4444'; // red
}

/**
 * Get the background color associated with a trust score.
 * @param {number} score - The trust score (0-100)
 * @returns {string} RGBA background string
 */
function getTrustBgColor(score) {
    if (score >= TRUST_THRESHOLDS.HIGH) return 'rgba(16, 185, 129, 0.1)';
    if (score >= TRUST_THRESHOLDS.MEDIUM) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(239, 68, 68, 0.1)';
}

/**
 * Check if a score qualifies as 'Verified'
 * @param {number} score 
 * @returns {boolean}
 */
function isTrustVerified(score) {
    return score >= TRUST_THRESHOLDS.HIGH;
}

module.exports = {
    getTrustColor,
    getTrustBgColor,
    isTrustVerified,
    TRUST_THRESHOLDS,
    TERMS
};
