const { getBadge } = require("../ranking/rankEngine");

function assignBadge({
  percentile,
  attempts = 1,
  trustScore = 100,
}) {
  // Use the central rank engine for tiered badges
  // We can add "Verified" prefix if trust is high
  const badgeData = getBadge(percentile); // Returns object { name: 'Elite Mind', ... }

  if (trustScore >= 80) {
    return `Verified ${badgeData.name}`;
  }

  return badgeData.name;
}

module.exports = { assignBadge };
