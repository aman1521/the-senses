// Backend/routes/cardRoutes.js
const express = require("express");
const rankCardService = require("../Services/rankCardService");

const router = express.Router();

// Generate shareable rank card data
router.post("/generate-data", (req, res) => {
  try {
    const cardData = rankCardService.generateCardData(req.body);
    res.json({
      success: true,
      data: cardData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get SVG version of card
router.get("/svg", (req, res) => {
  try {
    const userData = {
      userName: req.query.name || "User",
      score: parseInt(req.query.score) || 85,
      percentile: parseInt(req.query.percentile) || 75,
      badgeEmoji: req.query.emoji || "⭐",
      badgeColor: req.query.color || "#FFD700",
      globalRank: parseInt(req.query.rank) || 1,
      jobProfile: req.query.profile || "Developer",
      difficulty: req.query.difficulty || "Medium",
    };

    const svg = rankCardService.generateSVGCard(userData);
    res.type("image/svg+xml").send(svg);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// OpenGraph meta data for sharing
router.get("/og-meta", (req, res) => {
  try {
    const userData = {
      userName: req.query.name || "User",
      score: parseInt(req.query.score) || 85,
      percentile: parseInt(req.query.percentile) || 75,
      badge: req.query.badge || "Gold",
      globalRank: parseInt(req.query.rank) || 1,
      jobProfile: req.query.profile || "Developer",
      difficulty: req.query.difficulty || "Medium",
    };

    const cardData = rankCardService.generateCardData(userData);

    res.json({
      success: true,
      meta: {
        "og:title": cardData.title,
        "og:description": cardData.description,
        "og:image": `http://localhost:5000/api/cards/svg?name=${userData.userName}&score=${userData.score}&percentile=${userData.percentile}&badge=${userData.badge}&rank=${userData.globalRank}&profile=${userData.jobProfile}&difficulty=${userData.difficulty}`,
        "twitter:card": "summary_large_image",
        "twitter:title": cardData.title,
        "twitter:description": cardData.description,
      },
      sharing: {
        twitter: cardData.twitterText,
        linkedin: cardData.linkedinText,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
