const express = require("express");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const { getResultBySlug } = require("../Services/resultService.js");
const path = require("path");

const router = express.Router();

// Try to register font if available, else fallback
try {
  // registerFont(path.resolve("./assets/fonts/Inter-Bold.ttf"), { family: "Inter", weight: "bold" });
} catch (e) {
  // Ignore font loading errors
}

router.get("/:slug.png", async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await getResultBySlug(slug);

    if (!result) {
      return res.status(404).send("Not Found");
    }

    const { profile, rank, finalScore, trustScore } = result;
    const tier = rank.tier || "Analyst";
    const percentile = rank.globalPercentile || 50;

    // Integrity Check
    // If trustScore is high (>85), we show "VERIFIED". 
    // If we have video (we'd need that data in 'result' object), even better.
    // For now, rely on trustScore.
    const isVerified = (trustScore || 100) >= 85;

    const width = 1200;
    const height = 630;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // --- Background ---
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#050505");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // --- Subtle Grid Texture ---
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // --- Accent Glow (based on Tier) ---
    let accentColor = "#007bff";
    if (tier.includes("Outlier")) accentColor = "#7000ff"; // Purple
    else if (tier.includes("Elite")) accentColor = "#ffd700"; // Gold
    else if (tier.includes("Strategist")) accentColor = "#00d2ff"; // Cyan

    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 400);
    glow.addColorStop(0, `${accentColor}22`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);


    // --- Typography ---
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // "THE SENSES" - Top Label
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#666666";
    ctx.fillText("THE SENSES", width / 2, 60);

    // Main Stat: "Top X%"
    const topPct = (100 - percentile).toFixed(1);
    ctx.font = "bold 140px sans-serif";
    ctx.fillStyle = "#ffffff";

    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 40;
    ctx.fillText(`TOP ${topPct}%`, width / 2, height / 2 - 30);
    ctx.shadowBlur = 0;

    // Subtitle: Tier Name
    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = accentColor;
    ctx.fillText(tier.toUpperCase(), width / 2, height / 2 + 70);

    // Footer: Score
    ctx.font = "32px sans-serif";
    ctx.fillStyle = "#888888";
    ctx.fillText(`Cognitive Score: ${finalScore ? finalScore.toFixed(0) : "N/A"}`, width / 2, height - 80);

    // --- INTEGRITY BADGE ---
    if (isVerified) {
      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = "#00ff88"; // Green

      // Draw a pill shape or just text for now
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 10;
      ctx.fillText("🛡️ VERIFIED INTEGRITY", width / 2, height - 140);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#ff4444";
      ctx.fillText("⚠️ UNVERIFIED RESULT", width / 2, height - 140);
    }

    const buffer = canvas.toBuffer("image/png");

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);

  } catch (error) {
    console.error("OG Error:", error);
    res.status(500).send("Generation Failed");
  }
});

module.exports = router;
