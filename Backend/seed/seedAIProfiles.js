const AIProfile = require("../models/AIProfile");

// Seed AI profiles for benchmarking (matching battleAgent.js personas)
const aiProfiles = [
    {
        name: "Omni-G 4.0",
        description: "Simulating GPT-4o - Helpful, knowledgeable, and balanced",
        modelType: "GPT-4o",
        capabilities: {
            logical: 95,
            creative: 92,
            analytical: 94,
            memory: 88,
            speed: 85,
        },
        avgScore: 92,
        color: "#10a37f",
        emoji: "🧠",
    },
    {
        name: "Anthropic 3.5 Sonnet",
        description: "Simulating Claude 3.5 Sonnet - Concise, intelligent, safety-focused",
        modelType: "Claude 3.5",
        capabilities: {
            logical: 93,
            creative: 95,
            analytical: 92,
            memory: 90,
            speed: 87,
        },
        avgScore: 91,
        color: "#cc785c",
        emoji: "🎭",
    },
    {
        name: "Gemini 1.5 Pro",
        description: "Google's Gemini - Creative, thoughtful, connects concepts",
        modelType: "Gemini 1.5 Pro",
        capabilities: {
            logical: 90,
            creative: 88,
            analytical: 93,
            memory: 92,
            speed: 95,
        },
        avgScore: 90,
        color: "#4285f4",
        emoji: "💎",
    },
    {
        name: "Meta Llama 3",
        description: "Meta's Llama 3 - Fast, efficient, straight to the point",
        modelType: "Llama 3",
        capabilities: {
            logical: 85,
            creative: 83,
            analytical: 87,
            memory: 82,
            speed: 90,
        },
        avgScore: 85,
        color: "#0668e1",
        emoji: "🦙",
    },
    {
        name: "Mistral Large",
        description: "Mistral Large - Precise, European-centric logical rigor",
        modelType: "Mistral",
        capabilities: {
            logical: 88,
            creative: 86,
            analytical: 89,
            memory: 84,
            speed: 92,
        },
        avgScore: 88,
        color: "#ff6b6b",
        emoji: "🎯",
    },
    {
        name: "Grok 1.5",
        description: "Grok - Rebellious, witty, humorous, sometimes sarcastic",
        modelType: "Grok",
        capabilities: {
            logical: 87,
            creative: 94,
            analytical: 85,
            memory: 86,
            speed: 88,
        },
        avgScore: 88,
        color: "#000000",
        emoji: "⚡",
    },
];

async function seedAIProfiles() {
    try {
        // Clear existing profiles
        await AIProfile.deleteMany({});
        console.log("Cleared existing AI profiles");

        // Insert new profiles
        const inserted = await AIProfile.insertMany(aiProfiles);
        console.log(`✅ Seeded ${inserted.length} AI profiles successfully`);

        inserted.forEach(ai => {
            console.log(`  ${ai.emoji} ${ai.name} - Avg Score: ${ai.avgScore}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(" Seed failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    const mongoose = require('mongoose');
    const dotenv = require('dotenv');

    dotenv.config({ path: '../.env' });

    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/senses')
        .then(() => {
            console.log("📡 Connected to MongoDB");
            seedAIProfiles();
        })
        .catch(err => {
            console.error("MongoDB connection error:", err);
            process.exit(1);
        });
}

module.exports = seedAIProfiles;
