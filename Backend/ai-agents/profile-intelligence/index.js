const { normalizeAnswers } = require("./normalizer.js");
const { analyzeIntelligence } = require("./analyzer.js");
const QuestionBank = require("../../models/QuestionBank");

async function evaluateProfileIntelligence({ rawAnswers, detailedAnswers, jobProfile, difficulty }) {
    // 1. Skill Based Evaluation (if detailed answers provided)
    if (detailedAnswers && Array.isArray(detailedAnswers) && detailedAnswers.length > 0) {
        try {
            const questionIds = detailedAnswers.map(a => a.questionId).filter(Boolean);
            const dbQuestions = await QuestionBank.find({ _id: { $in: questionIds } });

            let totalPossible = 0;
            let totalScore = 0;

            // Map for quick lookup
            const qMap = {};
            dbQuestions.forEach(q => qMap[q._id.toString()] = q);

            detailedAnswers.forEach(ans => {
                const q = qMap[ans.questionId];
                if (q) {
                    const points = q.difficulty === 'hard' ? 20 : (q.difficulty === 'medium' ? 15 : 10);
                    totalPossible += points;

                    // define correct check (string comparison or index)
                    // Assuming q.correctAnswer and ans.userAnswer are comparable strings/indices
                    const isCorrect = String(q.correctAnswer).trim().toLowerCase() === String(ans.userAnswer).trim().toLowerCase();

                    if (isCorrect) {
                        totalScore += points;
                    }
                }
            });

            const finalPercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
            const roundedScore = Math.round(finalPercentage);

            return {
                normalizedAnswers: rawAnswers,
                score: roundedScore,
                finalScore: roundedScore,
                ruleScore: roundedScore * 10, // approximate specifically if scaling needed
                aiScore: roundedScore,
                timestamp: new Date()
            };

        } catch (error) {
            console.error("Grading Error:", error);
            // Fallback to legacy
        }
    }

    // 2. Legacy Psychometric Evaluation
    const normalized = normalizeAnswers(rawAnswers);
    const analysis = analyzeIntelligence({ answers: normalized, jobProfile, difficulty });

    return {
        normalizedAnswers: normalized,
        score: analysis,
        finalScore: analysis, // unify return structure
        ruleScore: analysis,
        aiScore: analysis,
        timestamp: new Date(),
    };
}

module.exports = { evaluateProfileIntelligence, runProfileIntelligenceAgent: evaluateProfileIntelligence };
