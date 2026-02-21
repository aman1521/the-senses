const User = require("../models/User");
const Duel = require("../models/Duel");
const Question = require("../models/Question");
const IntelligenceResult = require("../models/IntelligenceResult");
const { analyzeIntelligence } = require("../ai-agents/profile-intelligence/analyzer");
const { sendDuelInvitation, sendDuelResult } = require("../services/emailService");

// Config
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// POST /api/duels/challenge - Create a duel challenge
exports.createDuel = async (req, res) => {
    try {
        const { challengerId, opponentId, difficulty, jobProfile } = req.body;

        if (!challengerId || !opponentId) {
            return res.status(400).json({ error: "Challenger and opponent IDs required" });
        }

        if (challengerId === opponentId) {
            return res.status(400).json({ error: "Cannot challenge yourself" });
        }

        // Fetch User Details for Emails
        const challenger = await User.findById(challengerId);
        const opponent = await User.findById(opponentId);

        if (!challenger || !opponent) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get random questions for the duel
        const questions = await Question.aggregate([
            { $sample: { size: 5 } }
        ]);

        if (questions.length === 0) {
            return res.status(400).json({ error: "No questions available" });
        }

        // Get challenger's trust weight
        const challengerResult = await IntelligenceResult.findOne({ userId: challengerId })
            .sort({ createdAt: -1 });
        const challengerTrustWeight = challengerResult?.trustScore ?
            (1 + challengerResult.trustScore / 200) : 1;

        const duel = new Duel({
            challenger: challengerId,
            opponent: opponentId,
            questionSet: questions.map(q => q._id),
            challengerTrustWeight,
            status: 'pending',
        });

        await duel.save();

        // Send Email Notification
        if (opponent.email) {
            const duelLink = `${FRONTEND_URL}/duels?opponentId=${opponentId}`; // Link to duels page
            // Logic to open accept modal? Ideally deep link, but /duels is fine
            sendDuelInvitation(opponent.email, challenger.name, duelLink);
        }

        res.json({
            success: true,
            duel,
            questions: questions.map(q => ({
                _id: q._id,
                text: q.text,
                options: q.options,
            })),
        });
    } catch (error) {
        console.error("Create Duel Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/duels/:id/accept - Accept duel and submit answers
exports.acceptDuel = async (req, res) => {
    try {
        const { id } = req.params;
        const { opponentId, answers, difficulty, jobProfile } = req.body;

        const duel = await Duel.findById(id);

        if (!duel) {
            return res.status(404).json({ error: "Duel not found" });
        }

        if (duel.status !== 'pending') {
            return res.status(400).json({ error: "Duel already completed or accepted" });
        }

        if (String(duel.opponent) !== String(opponentId)) {
            return res.status(403).json({ error: "You are not the opponent in this duel" });
        }

        // Get opponent's trust weight
        const opponentResult = await IntelligenceResult.findOne({ userId: opponentId })
            .sort({ createdAt: -1 });
        const opponentTrustWeight = opponentResult?.trustScore ?
            (1 + opponentResult.trustScore / 200) : 1;

        // Calculate opponent's score
        const opponentScore = analyzeIntelligence({
            answers,
            jobProfile: jobProfile || 'developer',
            difficulty: difficulty || 'medium',
        });

        // Update duel with opponent data
        duel.opponentAnswers = answers;
        duel.opponentScore = opponentScore;
        duel.opponentTrustWeight = opponentTrustWeight;
        duel.status = 'accepted';

        await duel.save();

        res.json({
            success: true,
            message: "Duel accepted! Waiting for challenger to complete.",
            duel,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/duels/:id/complete - Challenger completes the duel
exports.completeDuel = async (req, res) => {
    try {
        const { id } = req.params;
        const { challengerId, answers, difficulty, jobProfile } = req.body;

        const duel = await Duel.findById(id)
            .populate('challenger')
            .populate('opponent');

        if (!duel) {
            return res.status(404).json({ error: "Duel not found" });
        }

        if (String(duel.challenger._id) !== String(challengerId)) {
            return res.status(403).json({ error: "You are not the challenger in this duel" });
        }

        // Calculate challenger's score
        const challengerScore = analyzeIntelligence({
            answers,
            jobProfile: jobProfile || 'developer',
            difficulty: difficulty || 'medium',
        });

        // Apply trust weighting
        const finalChallengerScore = Math.round(challengerScore * duel.challengerTrustWeight);
        const finalOpponentScore = Math.round(duel.opponentScore * duel.opponentTrustWeight);

        // Determine winner
        let winner;
        if (finalChallengerScore > finalOpponentScore) {
            winner = duel.challenger._id;
        } else if (finalOpponentScore > finalChallengerScore) {
            winner = duel.opponent._id;
        } else {
            winner = null; // Tie
        }

        // Update duel
        duel.challengerAnswers = answers;
        duel.challengerScore = challengerScore;
        duel.finalChallengerScore = finalChallengerScore;
        duel.finalOpponentScore = finalOpponentScore;
        duel.winner = winner;
        duel.status = 'completed';
        duel.completedAt = new Date();

        await duel.save();

        // Send Result Emails
        if (duel.challenger.email) {
            const isWinner = String(winner) === String(duel.challenger._id);
            sendDuelResult(duel.challenger.email, isWinner ? "You" : duel.opponent.name, isWinner);
        }
        if (duel.opponent.email) {
            const isWinner = String(winner) === String(duel.opponent._id);
            sendDuelResult(duel.opponent.email, isWinner ? "You" : duel.challenger.name, isWinner);
        }

        res.json({
            success: true,
            result: {
                challenger: {
                    name: duel.challenger.name,
                    baseScore: challengerScore,
                    trustWeight: duel.challengerTrustWeight,
                    finalScore: finalChallengerScore,
                },
                opponent: {
                    name: duel.opponent.name,
                    baseScore: duel.opponentScore,
                    trustWeight: duel.opponentTrustWeight,
                    finalScore: finalOpponentScore,
                },
                winner: winner ? (String(winner) === String(duel.challenger._id) ? duel.challenger.name : duel.opponent.name) : 'Tie',
                isDraw: !winner,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/duels/:id - Get duel details
exports.getDuel = async (req, res) => {
    try {
        const { id } = req.params;

        const duel = await Duel.findById(id)
            .populate('challenger', 'name trustLevel')
            .populate('opponent', 'name trustLevel')
            .populate('questionSet');

        if (!duel) {
            return res.status(404).json({ error: "Duel not found" });
        }

        res.json(duel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/duels/user/:userId - Get all duels for a user
exports.getUserDuels = async (req, res) => {
    try {
        const { userId } = req.params;

        const duels = await Duel.find({
            $or: [
                { challenger: userId },
                { opponent: userId }
            ]
        })
            .populate('challenger', 'name')
            .populate('opponent', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(duels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
