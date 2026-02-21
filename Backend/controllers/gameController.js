const GameSession = require('../models/GameSession');
const Question = require('../models/Question');
const IntegrityEvent = require('../models/IntegrityEvent');
const { calculateScore } = require('../Services/scoring.service');
const { updateTrust } = require('../Services/trust.service');
const { calculateCheatRisk } = require('../Services/antiCheatService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getQuestions = async (req, res, next) => {
  try {
    const questions = await Question.find().select('-correctOptionIndex'); // Don't send answers
    return successResponse(res, questions);
  } catch (error) {
    next(error);
  }
};

exports.submitGame = async (req, res, next) => {
  try {
    const { answers, timeTaken, questionDetails, questionTimings, tabSwitches, copyPasteEvents, devToolsOpen } = req.body; // Expect detailed breakdown if possible

    // Fetch all questions involved to verify answers securely server-side
    // For now, fetching all (prototype), in prod fetch by specific IDs
    const allQuestions = await Question.find();

    // Map answers to check correctness
    const processedQuestions = allQuestions.map((q, index) => {
      const userAnswer = answers[index]; // Simple index matching for now
      const isCorrect = userAnswer === q.correctOptionIndex;

      return {
        difficulty: q.difficulty || 'medium', // Default to medium if undefined
        isCorrect,
        timeSpent: (timeTaken / allQuestions.length) // Distributed avg time if specific times not tracked
      };
    });

    const score = calculateScore({ questions: processedQuestions });

    // --- PHASE 0: Anti-Cheat Risk Assessment ---
    let cheatRiskScore = 0;
    try {
      const riskAnalysis = calculateCheatRisk({
        answers,
        timeTaken,
        questionTimings,
        questions: processedQuestions,
        tabSwitches: tabSwitches || 0,
        copyPasteEvents: copyPasteEvents || 0,
        devToolsOpen: devToolsOpen || false
      });

      cheatRiskScore = riskAnalysis.riskScore;

      // Log risk to IntegrityEvent if elevated
      if (cheatRiskScore > 15) {
        await IntegrityEvent.create({
          sessionId: req.body.sessionId || 'unknown', // Ideally passed from frontend
          userId: req.user._id,
          stage: 'skill', // Assuming skill assessment for now
          eventType: 'RISK_ASSESSMENT',
          severity: riskAnalysis.riskLevel.toLowerCase(),
          details: JSON.stringify(riskAnalysis),
          timestamp: new Date()
        });
        console.log(`⚠️ Risk Detected for user ${req.user._id}: Score ${cheatRiskScore} (${riskAnalysis.riskLevel})`);
      }
    } catch (riskError) {
      console.error("Anti-Cheat Calculation Error:", riskError);
      // Do not block submission on anti-cheat error
    }
    // ------------------------------------------

    // Fetch recent sessions for trust analysis
    const recentSessions = await GameSession.find({ user: req.user._id })
      .sort({ startedAt: -1 })
      .limit(10);

    const metrics = {
      attempts: recentSessions.length + 1,
      scoreHistory: recentSessions.map(s => s.finalScore),
      difficultyHistory: recentSessions.map(s => s.difficulty || 'medium'),
      timeGaps: recentSessions.length > 0 ? [(new Date() - recentSessions[0].startedAt) / (1000 * 60)] : [60],
      cheatRiskScore // Pass risk score to trust service
    };

    updateTrust(req.user, metrics);
    const isNewRecord = score > req.user.bestScoreEver;

    if (isNewRecord) {
      req.user.bestScoreEver = score;

      // Create Notification
      try {
        await require('../models/Notification').create({
          recipient: req.user._id,
          type: 'achievement',
          title: 'New High Score! 🏆',
          message: `You achieved a new personal best of ${Math.round(score)}! Your cognitive tier is rising.`,
          data: { metadata: { score } }
        });
      } catch (err) {
        console.error("Failed to crate notification", err);
      }
    }

    await req.user.save();

    return successResponse(res, { score, isNewRecord }, "Game submitted successfully");

  } catch (err) {
    console.error("Game Submission Error:", err);
    return errorResponse(res, "Failed to submit game", 500, err.message);
  }
};
