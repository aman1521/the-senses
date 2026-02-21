// Backend/controllers/leaderboardControllerV2.js
// Enhanced leaderboard with ranking data

async function getGlobalLeaderboard(req, res) {
  try {
    // Mock data - would query database in production
    const mockLeaderboard = [
      {
        rank: 1,
        userId: "dev-001",
        userName: "Alex Chen",
        jobProfile: "developer",
        score: 96,
        normalizedScore: 111,
        percentile: 99,
        difficulty: "hard",
        badge: { emoji: "💎", name: "Diamond", color: "#00D9FF" },
        trustScore: 98,
        country: "US",
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        rank: 2,
        userId: "dev-002",
        userName: "Sarah Johnson",
        jobProfile: "developer",
        score: 92,
        normalizedScore: 107,
        percentile: 97,
        difficulty: "hard",
        badge: { emoji: "💎", name: "Diamond", color: "#00D9FF" },
        trustScore: 97,
        country: "UK",
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        rank: 3,
        userId: "des-001",
        userName: "Maya Patel",
        jobProfile: "designer",
        score: 88,
        normalizedScore: 99,
        percentile: 95,
        difficulty: "hard",
        badge: { emoji: "🥇", name: "Platinum", color: "#E8D024" },
        trustScore: 96,
        country: "Canada",
        createdAt: new Date(Date.now() - 10800000),
      },
      {
        rank: 4,
        userId: "mark-001",
        userName: "James Wilson",
        jobProfile: "marketer",
        score: 82,
        normalizedScore: 86,
        percentile: 85,
        difficulty: "medium",
        badge: { emoji: "🥈", name: "Gold", color: "#FFD700" },
        trustScore: 90,
        country: "Australia",
        createdAt: new Date(Date.now() - 14400000),
      },
      {
        rank: 5,
        userId: "dev-003",
        userName: "Emma Rodriguez",
        jobProfile: "developer",
        score: 78,
        normalizedScore: 93,
        percentile: 78,
        difficulty: "medium",
        badge: { emoji: "🥈", name: "Gold", color: "#FFD700" },
        trustScore: 88,
        country: "Spain",
        createdAt: new Date(Date.now() - 18000000),
      },
    ];

    res.json({
      success: true,
      data: {
        leaderboard: mockLeaderboard,
        total: mockLeaderboard.length,
        type: "global",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function getCountryLeaderboard(req, res) {
  try {
    const country = req.query.country || "US";

    // Mock data filtered by country
    const allEntries = [
      {
        rank: 1,
        userId: "dev-001",
        userName: "Alex Chen",
        jobProfile: "developer",
        score: 96,
        normalizedScore: 111,
        percentile: 99,
        difficulty: "hard",
        badge: { emoji: "💎", name: "Diamond", color: "#00D9FF" },
        trustScore: 98,
        country: "US",
      },
      {
        rank: 2,
        userId: "mark-002",
        userName: "Jennifer Lee",
        jobProfile: "marketer",
        score: 84,
        normalizedScore: 88,
        percentile: 88,
        difficulty: "medium",
        badge: { emoji: "🥇", name: "Platinum", color: "#E8D024" },
        trustScore: 92,
        country: "US",
      },
      {
        rank: 3,
        userId: "des-002",
        userName: "Michael Brown",
        jobProfile: "designer",
        score: 75,
        normalizedScore: 81,
        percentile: 72,
        difficulty: "medium",
        badge: { emoji: "🥈", name: "Gold", color: "#FFD700" },
        trustScore: 85,
        country: "US",
      },
    ];

    const countryLeaderboard = allEntries.filter((e) => e.country === country);

    res.json({
      success: true,
      data: {
        leaderboard: countryLeaderboard,
        total: countryLeaderboard.length,
        type: "country",
        country,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function getProfileLeaderboard(req, res) {
  try {
    const profile = req.query.profile || "developer";

    // Mock data filtered by profile
    const allEntries = [
      {
        rank: 1,
        userId: "dev-001",
        userName: "Alex Chen",
        jobProfile: "developer",
        score: 96,
        normalizedScore: 111,
        percentile: 99,
        difficulty: "hard",
        badge: { emoji: "💎", name: "Diamond", color: "#00D9FF" },
        trustScore: 98,
      },
      {
        rank: 2,
        userId: "dev-002",
        userName: "Sarah Johnson",
        jobProfile: "developer",
        score: 92,
        normalizedScore: 107,
        percentile: 97,
        difficulty: "hard",
        badge: { emoji: "💎", name: "Diamond", color: "#00D9FF" },
        trustScore: 97,
      },
      {
        rank: 3,
        userId: "dev-003",
        userName: "Emma Rodriguez",
        jobProfile: "developer",
        score: 78,
        normalizedScore: 93,
        percentile: 78,
        difficulty: "medium",
        badge: { emoji: "🥈", name: "Gold", color: "#FFD700" },
        trustScore: 88,
      },
    ];

    const profileLeaderboard = allEntries.filter(
      (e) => e.jobProfile === profile
    );

    res.json({
      success: true,
      data: {
        leaderboard: profileLeaderboard,
        total: profileLeaderboard.length,
        type: "profile",
        profile,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  getGlobalLeaderboard,
  getCountryLeaderboard,
  getProfileLeaderboard,
};
