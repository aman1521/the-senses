// scripts/testQuestionGeneration.js
// Test script for AI Question Generation
// Run with: node scripts/testQuestionGeneration.js

const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const { generateQuestionsForProfile } = require("../ai-agents/questions/questionGenerator");
const { getQuestionsForTest, pregenerateQuestionsForAllProfiles } = require("../Services/questionService");
const QuestionBank = require("../models/QuestionBank");

async function testQuestionGeneration() {
    try {
        console.log("🚀 Starting AI Question Generation Test...\n");

        // Connect to database
        await connectDB();
        console.log("✅ Connected to database\n");

        // Test 1: Generate questions for Software Engineer
        console.log("📝 Test 1: Generating questions for Software Engineer...");
        const swQuestions = await generateQuestionsForProfile("software-engineer", 5, "medium");
        console.log(`✅ Generated ${swQuestions.length} questions`);
        console.log("Sample question:", swQuestions[0].question);
        console.log("");

        // Test 2: Save questions to database
        console.log("💾 Test 2: Saving questions to database...");
        const saved = await QuestionBank.insertMany(swQuestions);
        console.log(`✅ Saved ${saved.length} questions to database`);
        console.log("");

        // Test 3: Retrieve questions from database
        console.log("🔍 Test 3: Retrieving questions from database...");
        const retrieved = await getQuestionsForTest("software-engineer", "medium", 5);
        console.log(`✅ Retrieved ${retrieved.length} questions`);
        console.log("");

        // Test 4: Check question stats
        console.log("📊 Test 4: Checking question statistics...");
        const stats = await QuestionBank.aggregate([
            {
                $group: {
                    _id: "$profileId",
                    count: { $sum: 1 },
                    avgUsage: { $avg: "$usageCount" }
                }
            }
        ]);
        console.log("Question stats:", stats);
        console.log("");

        console.log("✅ All tests passed!");
        console.log("\n🎉 AI Question Generation System is working!");

        process.exit(0);

    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

async function pregenerateAll() {
    try {
        console.log("🚀 Pre-generating questions for all profiles...\n");

        await connectDB();
        console.log("✅ Connected to database\n");

        const results = await pregenerateQuestionsForAllProfiles();

        console.log("\n✅ Pre-generation complete!");
        console.log("Success:", results.success);
        console.log("Failed:", results.failed);

        process.exit(0);

    } catch (error) {
        console.error("❌ Pre-generation failed:", error);
        process.exit(1);
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === "pregenerate") {
    pregenerateAll();
} else {
    testQuestionGeneration();
}
