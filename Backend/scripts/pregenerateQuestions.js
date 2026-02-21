// scripts/pregenerateQuestions.js
// Script to pre-generate questions for all job profiles
// Run this to populate the database with high-quality questions

require('dotenv').config();
const mongoose = require('mongoose');
const { pregenerateQuestionsForAllProfiles } = require('../services/questionService');

async function main() {
    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Pre-generate questions
        console.log('🚀 Starting question pre-generation...');
        console.log('This will generate 200 questions per profile/difficulty');
        console.log('Estimated time: 5-10 minutes\n');

        const results = await pregenerateQuestionsForAllProfiles();

        // Display results
        console.log('\n' + '='.repeat(60));
        console.log('📊 GENERATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`✅ Successful: ${results.success.length}`);
        results.success.forEach(item => console.log(`   - ${item}`));

        if (results.failed.length > 0) {
            console.log(`\n❌ Failed: ${results.failed.length}`);
            results.failed.forEach(item => console.log(`   - ${item}`));
        }

        console.log('\n✅ Script completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
