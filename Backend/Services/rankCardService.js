// Backend service for generating shareable rank cards
// Backend/Services/rankCardService.js

class RankCardGenerator {
  constructor() {
    this.cardWidth = 1200;
    this.cardHeight = 630;
  }

  // Generate a shareable rank card with ranking data
  generateCardData(userData) {
    const {
      userName = "User",
      score = 85,
      percentile = 75,
      badge = "Gold",
      globalRank = 1,
      jobProfile = "Developer",
      difficulty = "Hard",
      normalizedScore = 95,
    } = userData;

    const badgeEmojis = {
      diamond: "💎",
      platinum: "🥇",
      gold: "🥈",
      silver: "🥉",
      bronze: "🔶",
      starter: "🌱",
    };

    const badgeColors = {
      diamond: "#00D9FF",
      platinum: "#E8D024",
      gold: "#FFD700",
      silver: "#C0C0C0",
      bronze: "#CD7F32",
      starter: "#90EE90",
    };

    return {
      title: `${userName} scored ${score}/100 on The Senses`,
      description: `Top ${100 - percentile}% in ${difficulty} ${jobProfile} challenge`,
      image: this.generateImageURL({
        userName,
        score,
        percentile,
        badge,
        badgeEmoji: badgeEmojis[badge.toLowerCase()] || "⭐",
        badgeColor: badgeColors[badge.toLowerCase()] || "#FFD700",
        globalRank,
        jobProfile,
        difficulty,
        normalizedScore,
      }),
      twitterText: `I just scored ${score}/100 on The Senses AI challenge! 🎯 I'm in the top ${100 - percentile}% of users. Can you beat my score? 🚀 #TheSenses #AI`,
      linkedinText: `I achieved a score of ${score}/100 in The Senses AI intelligence evaluation (${difficulty} difficulty as a ${jobProfile}). I'm ranked in the top ${100 - percentile}% globally! 🚀 #AI #Testing`,
    };
  }

  generateImageURL(data) {
    // This would be implemented as an API endpoint that generates the image
    const params = new URLSearchParams({
      name: data.userName,
      score: data.score,
      percentile: data.percentile,
      badge: data.badge,
      emoji: data.badgeEmoji,
      color: data.badgeColor,
      rank: data.globalRank,
      profile: data.jobProfile,
      difficulty: data.difficulty,
      normalized: data.normalizedScore,
    });
    return `/api/cards/generate?${params.toString()}`;
  }

  // HTML SVG version for quick preview
  generateSVGCard(userData) {
    const {
      userName = "User",
      score = 85,
      percentile = 75,
      badgeEmoji = "🥈",
      badgeColor = "#FFD700",
      globalRank = 1,
      jobProfile = "Developer",
      difficulty = "Hard",
    } = userData;

    const width = 1200;
    const height = 630;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Gradient -->
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      
      <!-- Top Section -->
      <text x="600" y="80" font-size="48" font-weight="bold" text-anchor="middle" fill="white">
        The Senses AI Challenge
      </text>
      
      <!-- Badge Section -->
      <rect x="300" y="150" width="600" height="200" rx="20" fill="white" opacity="0.95"/>
      
      <!-- Badge Emoji -->
      <text x="600" y="280" font-size="120" text-anchor="middle">
        ${badgeEmoji}
      </text>
      
      <!-- Score Section -->
      <text x="150" y="420" font-size="36" fill="white" font-weight="bold">
        SCORE: ${score}/100
      </text>
      
      <text x="150" y="470" font-size="28" fill="white" opacity="0.9">
        ${difficulty} · ${jobProfile}
      </text>
      
      <!-- Rank Section -->
      <rect x="700" y="380" width="450" height="150" rx="15" fill="white" opacity="0.15"/>
      
      <text x="925" y="420" font-size="24" text-anchor="middle" fill="white" font-weight="bold">
        Global Rank
      </text>
      <text x="925" y="460" font-size="48" text-anchor="middle" fill="white" font-weight="bold">
        #${globalRank}
      </text>
      
      <text x="925" y="510" font-size="18" text-anchor="middle" fill="white" opacity="0.8">
        Top ${100 - percentile}%
      </text>
      
      <!-- Footer -->
      <text x="600" y="600" font-size="20" text-anchor="middle" fill="white" opacity="0.9">
        How do you rank? thesenses.ai
      </text>
    </svg>
    `;
  }
}

module.exports = new RankCardGenerator();
