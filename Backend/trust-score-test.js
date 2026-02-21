/**
 * TRUST SCORE TEST
 * 
 * Trust Score answers: "How confident are we that this score is GENUINE?"
 * It is NOT about intelligence. It's about CREDIBILITY.
 * 
 * Formula: Trust = (Score Confidence + Percentile Confidence) / 2
 * - Score Confidence = min(normalizedScore, 100)
 * - Percentile Confidence = percentile >= 50 ? 100 : (percentile * 2)
 */

const http = require("http");

// Test scenarios
const testCases = [
  {
    name: "🟢 GENUINE EXPERT (High Score + High Percentile)",
    description: "Developer scores 95/100 on HARD test = Very credible",
    data: {
      answers: { q1: 10, q2: 9, q3: 10 },
      jobProfile: "developer",
      difficulty: "hard",
    },
    expectedTrust: "HIGH (95+)",
    reasoning: "Score confidence high (95) + Percentile confidence high (100) = Credible",
  },
  {
    name: "🟡 MEDIOCRE AVERAGE (Mid Score + Mid Percentile)",
    description: "Marketer scores 65/100 on EASY test = Moderate credibility",
    data: {
      answers: { q1: 6, q2: 7, q3: 6 },
      jobProfile: "marketer",
      difficulty: "easy",
    },
    expectedTrust: "MEDIUM (55-70)",
    reasoning: "Score confidence medium (67) + Percentile confidence medium (80-100) = Questionable",
  },
  {
    name: "🔴 SUSPICIOUS LOW (Low Score + Low Percentile)",
    description: "Designer scores 25/100 on HARD test = Low credibility",
    data: {
      answers: { q1: 2, q2: 3, q3: 2 },
      jobProfile: "designer",
      difficulty: "hard",
    },
    expectedTrust: "LOW (25-50)",
    reasoning: "Score confidence low (25) + Percentile confidence low (50) = Not credible",
  },
  {
    name: "🟠 OUTLIER (Very High Score + Low Percentile)",
    description: "Unknown scores 88/100 on EASY test = Suspicious",
    data: {
      answers: { q1: 9, q2: 9, q3: 8 },
      jobProfile: "default",
      difficulty: "easy",
    },
    expectedTrust: "MEDIUM-HIGH (70+)",
    reasoning: "Score confidence high (88) but easy test (low difficulty weight) = Less impressive",
  },
];

async function runTest(testCase, index) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(testCase.data);

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/intelligence/evaluate",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          const ranking = response.result.ranking;

          const result = {
            testNum: index + 1,
            name: testCase.name,
            description: testCase.description,
            actual: {
              score: response.result.score,
              normalizedScore: ranking.normalizedScore,
              percentile: ranking.percentile,
              trustScore: ranking.trustScore,
              badge: ranking.badge.emoji + " " + ranking.badge.name,
            },
            expected: testCase.expectedTrust,
            reasoning: testCase.reasoning,
            credibilityAnalysis: analyzeTrust(ranking),
          };

          resolve(result);
        } catch (e) {
          resolve({
            testNum: index + 1,
            name: testCase.name,
            error: e.message,
          });
        }
      });
    });

    req.on("error", (e) => {
      resolve({
        testNum: index + 1,
        name: testCase.name,
        error: `Request failed: ${e.message}`,
      });
    });

    req.write(postData);
    req.end();
  });
}

function analyzeTrust(ranking) {
  const trust = ranking.trustScore;
  let credibility = "";

  if (trust >= 85) {
    credibility = "✅ HIGHLY CREDIBLE - Score likely genuine and well-earned";
  } else if (trust >= 70) {
    credibility =
      "⚠️  CREDIBLE - Score is reasonable, but could have variations";
  } else if (trust >= 50) {
    credibility =
      "❓ QUESTIONABLE - Score credibility is moderate, verify performance";
  } else {
    credibility =
      "🚨 LOW CREDIBILITY - Score may not be representative or genuine";
  }

  return {
    score: trust + "%",
    assessment: credibility,
    breakdown: {
      "Score Confidence": Math.min(100, ranking.normalizedScore) + "%",
      "Percentile Confidence":
        ranking.percentile >= 50
          ? "100% (Above average)"
          : ranking.percentile * 2 + "% (Below average)",
      "Average Confidence": trust + "%",
    },
  };
}

async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║         TRUST SCORE TEST - CREDIBILITY vs INTELLIGENCE         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");
  console.log(
    '📌 WHAT IS TRUST SCORE? It answers: "How confident are we the score is GENUINE?"\n'
  );

  for (let i = 0; i < testCases.length; i++) {
    console.log("─".repeat(70));
    console.log(`\n TEST ${i + 1}: ${testCases[i].name}`);
    console.log(`\n 📝 Description: ${testCases[i].description}\n`);

    const result = await runTest(testCases[i], i);

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(" 📊 RESULTS:");
      console.log(`    Score: ${result.actual.score}/100`);
      console.log(`    Normalized: ${result.actual.normalizedScore}`);
      console.log(`    Percentile: ${result.actual.percentile}%`);
      console.log(`    Badge: ${result.actual.badge}`);
      console.log(`\n 🔐 TRUST ANALYSIS:`);
      console.log(`    Trust Score: ${result.credibilityAnalysis.score}`);
      console.log(`    Assessment: ${result.credibilityAnalysis.assessment}`);
      console.log(`\n    Score Confidence: ${result.credibilityAnalysis.breakdown["Score Confidence"]}`);
      console.log(`    Percentile Confidence: ${result.credibilityAnalysis.breakdown["Percentile Confidence"]}`);
      console.log(`    → Average = ${result.credibilityAnalysis.breakdown["Average Confidence"]}`);
      console.log(`\n 💡 Why this trust level?`);
      console.log(`    ${result.reasoning}`);
    }

    console.log();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("─".repeat(70));
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                       KEY INSIGHTS                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`
  1. TRUST ≠ INTELLIGENCE
     • Trust Score measures confidence in score AUTHENTICITY
     • NOT whether the person is smart or not
     • A low trust score doesn't mean they're unintelligent
  
  2. WHAT BUILDS TRUST?
     ✓ High raw score (score confidence)
     ✓ High percentile ranking (performing better than peers)
     ✓ Both together = "This score is genuine"
  
  3. WHAT REDUCES TRUST?
     ✗ Low raw score
     ✗ Performing below average
     ✗ Mismatch between score and difficulty
  
  4. REAL-WORLD MEANING
     • High Trust (85%+): "This person actually performed well"
     • Medium Trust (50-70%): "The score is reasonable but not exceptional"
     • Low Trust (<50%): "This score seems inconsistent or below capability"
  
  5. WHY IT MATTERS
     • Prevents fake/inflated scores from ranking high
     • Shows who actually mastered the challenge
     • Credibility > Raw Score for real achievements
  `);

  console.log("─".repeat(70) + "\n");
  process.exit(0);
}

runAllTests().catch(console.error);
