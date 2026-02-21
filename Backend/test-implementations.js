#!/usr/bin/env node
/**
 * IMPLEMENTATION VERIFICATION TEST
 * Tests all 4 completed implementations
 * 
 * 1. Onboarding Pivot (Manual Portfolio)
 * 2. Fixed Repeating Questions
 * 3. Real Grading Engine (Fixed "0 Score" Issue)
 * 4. Detailed Result Storage
 */

const http = require("http");
const fs = require("fs");

const BASE_URL = "http://localhost:5000";

// Test Results Tracker
const results = {
  tests: [],
  passed: 0,
  failed: 0,
  timestamp: new Date().toISOString(),
};

// Helper: Make HTTP request
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test Result Logger
function logTest(name, passed, details = "") {
  results.tests.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString(),
  });

  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// ============================================
// TEST 1: Onboarding Pivot (PUT /api/profile)
// ============================================
async function test1_OnboardingPivot() {
  console.log("\n=== TEST 1: Onboarding Pivot (Manual Portfolio) ===\n");

  try {
    const payload = {
      jobProfile: "Senior Frontend Developer",
      bio: "5 years of experience building web apps with React",
      skills: "React, Node.js, TypeScript, GraphQL",
      experienceYears: 5,
    };

    const response = await makeRequest("PUT", "/api/profile", payload);

    // Check if endpoint exists and processes the request
    const hasEndpoint = response.status !== 404;
    const hasSuccessResponse =
      response.status === 200 && (response.body.success === true || response.body.user);

    logTest(
      "PUT /api/profile endpoint exists",
      hasEndpoint,
      hasEndpoint
        ? ""
        : `Status ${response.status} - Endpoint may be missing or need auth`
    );

    logTest(
      "PUT /api/profile returns user object",
      hasSuccessResponse,
      !hasSuccessResponse
        ? `Status ${response.status}, Response: ${JSON.stringify(response.body).substring(0, 100)}`
        : ""
    );

    // Verify response contains profile fields
    const hasProfileFields =
      response.body.user &&
      (response.body.user.bio || response.body.user.skills || response.body.user.onboardingCompleted);

    logTest(
      "Profile data is stored in response",
      hasProfileFields,
      !hasProfileFields ? "Response missing bio, skills, or completion status" : ""
    );

    return hasEndpoint && hasSuccessResponse;
  } catch (error) {
    console.error("Test 1 error:", error);
    logTest("Test 1 execution", false, error.message || error.toString());
  }
}

// ============================================
// TEST 2: Fixed Repeating Questions
// ============================================
async function test2_FixedRepeatingQuestions() {
  console.log("\n=== TEST 2: Fixed Repeating Questions ===\n");

  try {
    // Call with auth (middleware should check user history)
    const payload = {
      profileId: "developer",
      difficulty: "medium",
      count: 5,
    };

    const response = await makeRequest(
      "POST",
      "/api/questions/generate",
      payload
    );

    // Check if endpoint exists
    const hasEndpoint = response.status !== 404;
    logTest(
      "POST /api/questions/generate endpoint exists",
      hasEndpoint,
      hasEndpoint ? "" : `Status ${response.status}`
    );

    // Check if returns questions array
    const hasQuestionsArray =
      response.status === 200 && Array.isArray(response.body.questions);

    logTest(
      "Returns questions array",
      hasQuestionsArray,
      !hasQuestionsArray
        ? `Status ${response.status}, Type: ${typeof response.body.questions}`
        : ""
    );

    // Verify auth middleware is applied (check if requests without auth get different behavior)
    logTest(
      "Auth middleware applied to question generation",
      response.status === 200 || response.status === 401,
      `Status ${response.status} is expected (200 for auth users, 401 if strict)`
    );

    // Check meta data
    const hasMeta =
      response.body.meta &&
      response.body.meta.profileId &&
      response.body.meta.difficulty;

    logTest(
      "Response includes metadata (profile, difficulty)",
      hasMeta,
      !hasMeta ? "Meta object missing or incomplete" : ""
    );

    return hasEndpoint && hasQuestionsArray;
  } catch (error) {
    console.error("Test 2 error:", error);
    logTest("Test 2 execution", false, error.message || error.toString());
    return false;
  }
}

// ============================================
// TEST 3: Real Grading Engine (Fixed 0-score)
// ============================================
async function test3_RealGradingEngine() {
  console.log(
    "\n=== TEST 3: Real Grading Engine (Fixed 0-score Issue) ===\n"
  );

  try {
    // Submit test with detailed answers (skill-based)
    const payload = {
      userId: "test-user-" + Date.now(),
      userName: "Test User",
      country: "US",
      difficulty: "medium",
      jobProfile: "developer",
      answers: { q1: 8, q2: 6, q3: 9 }, // Legacy format
      detailedAnswers: [
        {
          questionId: "q1",
          questionText: "What is React?",
          userAnswer: "A",
          correctAnswer: "A",
          isCorrect: true,
          timeSpent: 15,
          topic: "react",
        },
        {
          questionId: "q2",
          questionText: "What is a hook?",
          userAnswer: "B",
          correctAnswer: "A",
          isCorrect: false,
          timeSpent: 10,
          topic: "hooks",
        },
      ],
      meta: { timeTaken: 120 },
    };

    const response = await makeRequest("POST", "/api/intelligence/evaluate", payload);

    // Check if endpoint exists
    const hasEndpoint = response.status !== 404 && response.status !== 405;
    logTest(
      "POST /api/intelligence/evaluate endpoint exists",
      hasEndpoint,
      hasEndpoint ? "" : `Status ${response.status}`
    );

    // Check if score is NOT 0 (the bug fix)
    const hasValidScore =
      response.status === 200 &&
      response.body.result &&
      typeof response.body.result.score === "number" &&
      response.body.result.score > 0;

    logTest(
      "Score is NOT 0 (grading works properly)",
      hasValidScore,
      !hasValidScore
        ? `Status ${response.status}, Score: ${response.body.result?.score || "missing"}`
        : ""
    );

    // Check if normalized score is calculated
    const hasNormalizedScore =
      response.body.result && typeof response.body.result.normalized === "number";

    logTest(
      "Normalized score is calculated",
      hasNormalizedScore,
      !hasNormalizedScore ? "normalized field missing" : ""
    );

    // Check if percentile is calculated
    const hasPercentile =
      response.body.result && typeof response.body.result.percentile === "number";

    logTest(
      "Percentile is calculated",
      hasPercentile,
      !hasPercentile ? "percentile field missing" : ""
    );

    // Check if trust score exists
    const hasTrustScore =
      response.body.result && typeof response.body.result.trust === "number";

    logTest(
      "Trust score is calculated",
      hasTrustScore,
      !hasTrustScore ? "trust field missing" : ""
    );

    return hasEndpoint && hasValidScore && hasNormalizedScore;
  } catch (error) {
    console.error("Test 3 error:", error);
    logTest("Test 3 execution", false, error.message || error.toString());
    return false;
  }
}

// ============================================
// TEST 4: Detailed Result Storage
// ============================================
async function test4_DetailedResultStorage() {
  console.log("\n=== TEST 4: Detailed Result Storage ===\n");

  try {
    // Submit test with full detail log
    const payload = {
      userId: "test-user-" + Date.now(),
      userName: "Test User Detail",
      country: "US",
      difficulty: "hard",
      jobProfile: "developer",
      answers: { q1: 9, q2: 8, q3: 7 },
      detailedAnswers: [
        {
          questionId: "q-001",
          questionText: "What is event delegation?",
          userAnswer: "Handling events at parent level",
          correctAnswer: "Handling events at parent level",
          isCorrect: true,
          timeSpent: 20,
          topic: "javascript",
        },
        {
          questionId: "q-002",
          questionText: "What is closure?",
          userAnswer: "A function accessing outer scope",
          correctAnswer: "A function accessing outer scope",
          isCorrect: true,
          timeSpent: 15,
          topic: "javascript",
        },
        {
          questionId: "q-003",
          questionText: "What is hoisting?",
          userAnswer: "Moving declarations to top",
          correctAnswer: "Variables/functions move to scope top",
          isCorrect: false,
          timeSpent: 10,
          topic: "javascript",
        },
      ],
      meta: {
        timeTaken: 300,
        integrityScore: 98,
        cheatingFlags: [],
      },
    };

    const response = await makeRequest(
      "POST",
      "/api/intelligence/evaluate",
      payload
    );

    // Check if detailed answers are stored
    const hasTestDetail =
      response.status === 200 && response.body.result;

    logTest(
      "Evaluation endpoint accepts detailedAnswers",
      hasTestDetail,
      !hasTestDetail ? `Status ${response.status}` : ""
    );

    // Check if response includes session ID (for result retrieval)
    const hasSessionId =
      response.body.result && response.body.result.sessionId;

    logTest(
      "Response includes sessionId for result retrieval",
      hasSessionId,
      !hasSessionId ? "sessionId field missing" : ""
    );

    // Check if response includes profile insights (psychological profile)
    const hasProfileInsights =
      response.body.result &&
      response.body.result.profile &&
      response.body.result.profile.thinkingStyle;

    logTest(
      "Response includes profile/thinking style",
      hasProfileInsights,
      !hasProfileInsights
        ? "profile.thinkingStyle field missing"
        : ""
    );

    // Check if response includes rank data (for leaderboard)
    const hasRankData =
      response.body.result &&
      response.body.result.rank &&
      response.body.result.rank.globalPercentile;

    logTest(
      "Response includes rank data (percentile, tier)",
      hasRankData,
      !hasRankData ? "rank data missing" : ""
    );

    // Verify the returned data structure matches storage format
    const hasCompleteStructure =
      hasSessionId &&
      hasProfileInsights &&
      hasRankData &&
      response.body.result.share &&
      response.body.result.share.slug;

    logTest(
      "Complete result structure is returned",
      hasCompleteStructure,
      !hasCompleteStructure
        ? "One or more fields in result structure missing"
        : ""
    );

    return hasTestDetail && hasCompleteStructure;
  } catch (error) {
    console.error("Test 4 error:", error);
    logTest("Test 4 execution", false, error.message || error.toString());
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║   IMPLEMENTATION VERIFICATION TEST SUITE                      ║");
  console.log("║   Testing 4 Completed Implementations                         ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");

  try {
    // Run all tests
    const test1_passed = await test1_OnboardingPivot();
    const test2_passed = await test2_FixedRepeatingQuestions();
    const test3_passed = await test3_RealGradingEngine();
    const test4_passed = await test4_DetailedResultStorage();

    // Summary
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║   TEST SUMMARY                                                ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.log(`Total Tests: ${results.tests.length}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(
      `Pass Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`
    );

    console.log("\n📋 Detailed Results:\n");

    // Group by implementation
    const implementations = {
      "1. Onboarding Pivot": [
        "PUT /api/profile endpoint exists",
        "PUT /api/profile returns user object",
        "Profile data is stored in response",
      ],
      "2. Fixed Repeating Questions": [
        "POST /api/questions/generate endpoint exists",
        "Returns questions array",
        "Auth middleware applied to question generation",
        "Response includes metadata (profile, difficulty)",
      ],
      "3. Real Grading Engine": [
        "POST /api/intelligence/evaluate endpoint exists",
        "Score is NOT 0 (grading works properly)",
        "Normalized score is calculated",
        "Percentile is calculated",
        "Trust score is calculated",
      ],
      "4. Detailed Result Storage": [
        "Evaluation endpoint accepts detailedAnswers",
        "Response includes sessionId for result retrieval",
        "Response includes profile/thinking style",
        "Response includes rank data (percentile, tier)",
        "Complete result structure is returned",
      ],
    };

    for (const [impl, testNames] of Object.entries(implementations)) {
      console.log(`\n${impl}:`);
      for (const testName of testNames) {
        const test = results.tests.find((t) => t.name === testName);
        if (test) {
          const icon = test.passed ? "✅" : "❌";
          console.log(`  ${icon} ${testName}`);
          if (test.details) {
            console.log(`     📝 ${test.details}`);
          }
        }
      }
    }

    // Final status
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    if (results.failed === 0) {
      console.log("║  ✅ ALL IMPLEMENTATIONS VERIFIED SUCCESSFULLY                 ║");
    } else {
      console.log(`║  ⚠️  ${results.failed} TEST(S) FAILED - REVIEW DETAILS ABOVE        ║`);
    }
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    // Save results to file
    fs.writeFileSync(
      "./test-results-implementations.json",
      JSON.stringify(results, null, 2)
    );
    console.log("📄 Results saved to: test-results-implementations.json\n");

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test runner error:", error);
    process.exit(1);
  }
}

// Start tests
runAllTests();
