const { createCanvas } = require("canvas");

function generateShareCard({
    username,
    rank,
    percentile,
    score,
    trustScore,
}) {
    const width = 1200;
    const height = 630;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Accent gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(1, "#9333ea");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 180);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("The Senses", 60, 90);

    // Rank
    ctx.font = "bold 96px sans-serif";
    ctx.fillText(`#${rank}`, 60, 320);

    ctx.font = "32px sans-serif";
    ctx.fillText("Global Rank", 60, 360);

    // Stats
    ctx.font = "28px sans-serif";
    ctx.fillText(`Score: ${score}`, 60, 430);
    ctx.fillText(`Top ${percentile}%`, 60, 470);
    ctx.fillText(`Trust: ${trustScore}/100`, 60, 510);

    // Username
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(username, 900, 580);

    return canvas.toBuffer("image/png");
}

module.exports = { generateShareCard };
