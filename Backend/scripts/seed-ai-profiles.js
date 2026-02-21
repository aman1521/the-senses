const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AIProfile = require('../models/AIProfile');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const aiProfiles = [
    {
        name: "Omni-G 4.0",
        description: "The versatile titan of reasoning and creativity.",
        modelType: "GPT-4o",
        capabilities: { logical: 98, creative: 95, analytical: 96, memory: 92, speed: 88 },
        color: "#10a37f",
        emoji: "🧠"
    },
    {
        name: "Anthropic 3.5 Sonnet",
        description: "Precision-engineered for coding and nuanced logic.",
        modelType: "Claude 3.5 Sonnet",
        capabilities: { logical: 99, creative: 92, analytical: 97, memory: 95, speed: 90 },
        color: "#d97757",
        emoji: "📡"
    },
    {
        name: "Gemini 1.5 Pro",
        description: "Massive context window with fluid reasoning.",
        modelType: "Gemini 1.5",
        capabilities: { logical: 94, creative: 96, analytical: 95, memory: 100, speed: 94 },
        color: "#4285f4",
        emoji: "✨"
    },
    {
        name: "Meta Llama 3",
        description: "The open-source champion of speed and efficiency.",
        modelType: "Llama 3 70B",
        capabilities: { logical: 88, creative: 85, analytical: 89, memory: 80, speed: 98 },
        color: "#0668E1",
        emoji: "🦙"
    },
    {
        name: "Mistral Large",
        description: "European precision with high reasoning capabilities.",
        modelType: "Mistral Large",
        capabilities: { logical: 91, creative: 88, analytical: 90, memory: 85, speed: 93 },
        color: "#facc15",
        emoji: "🌪️"
    },
    {
        name: "Grok 1.5",
        description: "Rebellious intelligence with real-time access.",
        modelType: "Grok-1",
        capabilities: { logical: 89, creative: 94, analytical: 88, memory: 82, speed: 96 },
        color: "#fff",
        emoji: "🛸"
    }
];

const seedUI = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await AIProfile.deleteMany({});
        console.log('🗑️ Cleared existing AI profiles');

        await AIProfile.insertMany(aiProfiles);
        console.log(`✨ Seeded ${aiProfiles.length} AI profiles successfully`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding AI profiles:', error);
        process.exit(1);
    }
};

seedUI();
