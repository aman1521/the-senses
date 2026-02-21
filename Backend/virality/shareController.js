const { generateShareCard } = require("./shareCardGenerator");
const fs = require("fs");
const path = require("path");

const generateCard = async (req, res) => {
    const user = req.user; // already authenticated

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const fileName = `rank-${user.id || user._id}.png`;
    const relativePath = `public/share/${fileName}`;
    const absolutePath = path.join(process.cwd(), relativePath);

    // CACHE CHECK: If file exists and is recent (e.g., < 7 days), serve existing URL
    if (fs.existsSync(absolutePath)) {
        const stats = fs.statSync(absolutePath);
        const now = new Date().getTime();
        const fileAge = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24); // age in days

        if (fileAge < 7) {
            return res.json({ url: `/public/share/${fileName}`, cached: true });
        }
    }

    const buffer = generateShareCard({
        username: user.username || user.name || "Anonymous",
        rank: user.rank || 0,
        percentile: user.percentile || 0,
        score: user.score || 0,
        trustScore: user.trustScore || 0,
    });

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, buffer);

    res.json({
        url: `/public/share/${fileName}`,
        cached: false,
    });
};

module.exports = { generateCard };
