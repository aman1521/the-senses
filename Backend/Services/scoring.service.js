/**
 * Advanced Scoring Engine
 * Uses Difficulty-Weighted ELO logic to rank users fairly.
 * 
 * Formula:
 * Score = Sum(QuestionWeight * IsCorrect) + TimeBonus
 * 
 * Weights:
 * - Easy: 10 pts
 * - Medium: 20 pts
 * - Hard: 35 pts
 * 
 * Time Bonus:
 * - Answered in < 5s: +5 pts (Speed Demon)
 * - Answered in < 10s: +2 pts
 */
exports.calculateScore = ({ questions = [] }) => {
  let rawScore = 0;
  let maxPossibleScore = 0;

  questions.forEach(q => {
    // Base Points by Difficulty
    let points = 10; // Default Easy
    if (q.difficulty === 'medium') points = 20;
    if (q.difficulty === 'hard') points = 35;

    maxPossibleScore += (points + 5); // Max points + Max speed bonus

    if (q.isCorrect) {
      rawScore += points;

      // Time Bonus (Speed)
      // Assuming timeSpent is in milliseconds
      if (q.timeSpent && q.timeSpent < 5000) {
        rawScore += 5; // Lightning fast
      } else if (q.timeSpent && q.timeSpent < 10000) {
        rawScore += 2; // Fast
      }
    }
  });

  // Normalize to a 0-1000 scale for ELO Rating
  // If no questions, score is 0
  if (maxPossibleScore === 0) return 0;

  const eloRating = Math.round((rawScore / maxPossibleScore) * 1000);
  return eloRating;
};
