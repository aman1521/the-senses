const express = require('express');
const {
    createDuel,
    acceptDuel,
    completeDuel,
    getDuel,
    getUserDuels,
} = require('../controllers/duelController');
const { resolveDuel } = require("../ai-agents/duels/duelService.js");
const Duel = require("../models/Duel.js");

const { auth } = require("../middleware/auth.js");
const { strictLimiter } = require("../middleware/rateLimit.js");

const router = express.Router();

// Apply globally to this router (required authentication)
router.use(auth(true));

// POST /api/duels/challenge - Create a duel  
router.post('/challenge', strictLimiter, createDuel);

// POST /api/duels/:id/accept - Accept and answer duel
router.post('/:id/accept', strictLimiter, acceptDuel);

// POST /api/duels/:id/complete - Complete duel (challenger answers)
router.post('/:id/complete', strictLimiter, completeDuel);

// GET /api/duels/:id - Get duel details
router.get('/:id', getDuel);

// GET /api/duels/user/:userId - Get user's duels
router.get('/user/:userId', getUserDuels);

/** Create duel (alternate endpoint) */
router.post("/create", async (req, res) => {
    try {
        const { opponentId, jobProfile, difficulty } = req.body;

        const duel = await Duel.create({
            challenger: req.user?._id || req.body.challengerId,
            opponent: opponentId,
            jobProfile,
            difficulty,
        });

        res.json({ success: true, duel });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** Submit duel result */
router.post("/:id/submit", async (req, res) => {
    try {
        const duel = await Duel.findById(req.params.id);
        if (!duel) return res.status(404).json({ error: "Not found" });

        const isChallenger =
            duel.challenger.toString() === (req.user?._id?.toString() || req.body.userId);

        const payload = {
            finalScore: req.body.finalScore,
            normalizedScore: req.body.normalizedScore,
            trustScore: req.body.trustScore,
        };

        if (isChallenger) duel.challengerResult = payload;
        else duel.opponentResult = payload;

        duel.status = "active";
        await duel.save();

        const resolved = await resolveDuel(duel._id);

        res.json({ success: true, duel: resolved });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
