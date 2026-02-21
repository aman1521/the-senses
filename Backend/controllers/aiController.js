const Attempt = require('../models/Attempt');
const Question = require('../models/Question');
const User = require("../models/User");
const { retrieveContext } = require("../Services/ragService");
const { rubricScore, tierFromScore } = require("../Services/gradingService");
const { planFollowUp, generateTwistedQuestion } = require("../Services/aiPlanner");
const { checkAllowed } = require("../Services/moderationService");

// POST /api/ai/assist   (grade + feedback + follow-up, with RAG)
exports.assist = async (req, res) => {
  try {
    const { userId, questionId, userAnswer } = req.body;

    if (!checkAllowed(userAnswer).ok) return res.status(400).json({ error: "Input blocked" });

    const [user, question] = await Promise.all([
      User.findById(userId),
      Question.findById(questionId)
    ]);
    if (!user || !question) return res.status(404).json({ error: "User or Question not found" });

    // RAG context
    const { context } = await retrieveContext(
      { domain: user.profileType === "professional" ? user.domain : null, profileType: user.profileType },
      question.prompt
    );

    // Rule score + AI plan
    const { bins, base } = rubricScore(userAnswer);
    const ai = await planFollowUp({ question, userAnswer, context, profile: user });
    const score = Math.min(100, base + (ai.dimension ? 20 : 10)); // hybrid scoring

    const attempt = await Attempt.create({
      user: user._id,
      question: question._id,
      answerText: userAnswer,
      score,
      rubric: { bins, dimension: ai.dimension || null },
      feedback: ai.feedback,
      followUp: ai.followUp,
      profileSnapshot: { profileType: user.profileType }
    });

    // update user stats
    user.stats.gamesPlayed += 1;
    user.stats.score = Math.max(user.stats.score, score);
    user.stats.level = score >= 85 ? 5 : score >= 65 ? 4 : score >= 45 ? 3 : 2;
    await user.save();

    res.json({
      score,
      tier: tierFromScore(score),
      feedback: ai.feedback,
      followUp: ai.followUp,
      rubric: attempt.rubric
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};

// POST /api/ai/generate  (create a twisted question for a domain/level)
exports.generate = async (req, res) => {
  try {
    const { domain = "general", level = 3, seedNotes = "" } = req.body;
    const { context } = await retrieveContext({ domain }, seedNotes);
    const q = await generateTwistedQuestion({ domain, level, seedNotes, context });

    if (!q) return res.status(500).json({ error: "AI could not generate question" });

    const doc = await Question.create({
      id: `ai-${Date.now()}`,
      domain,
      level,
      type: q.type,
      prompt: q.prompt,
      choices: q.choices || []
    });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
