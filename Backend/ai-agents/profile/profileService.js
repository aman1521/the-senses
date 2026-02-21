const UserProfile = require("../../models/UserProfile.js");

async function upsertUserProfile({
    userId,
    finalScore,
    normalizedScore,
    trustScore,
    difficulty,
    badge,
}) {
    const profile =
        (await UserProfile.findOne({ userId })) ||
        new UserProfile({ userId });

    // progression log
    profile.progression.push({
        finalScore,
        normalizedScore,
        trustScore,
        difficulty,
        createdAt: new Date(),
    });

    // stats
    profile.stats.attempts += 1;
    profile.stats.bestScore = Math.max(profile.stats.bestScore, finalScore);
    profile.stats.bestNormalized = Math.max(
        profile.stats.bestNormalized,
        normalizedScore
    );

    const totalScores = profile.progression.reduce(
        (sum, p) => sum + p.finalScore,
        0
    );
    const totalTrust = profile.progression.reduce(
        (sum, p) => sum + p.trustScore,
        0
    );

    profile.stats.avgScore = Math.round(
        totalScores / profile.progression.length
    );
    profile.stats.avgTrust = Math.round(
        totalTrust / profile.progression.length
    );

    // badges (unique)
    if (badge && !profile.badges.includes(badge)) {
        profile.badges.push(badge);
    }

    await profile.save();
    return profile;
}

module.exports = { upsertUserProfile };
