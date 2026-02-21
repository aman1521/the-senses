
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const QuestionBank = require('../models/QuestionBank');

async function checkAndCleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        const total = await QuestionBank.countDocuments();
        console.log(`Total questions: ${total}`);

        if (total === 0) {
            console.log("No questions found.");
            process.exit(0);
        }

        // Check for duplicates
        const duplicates = await QuestionBank.aggregate([
            {
                $group: {
                    _id: "$question",
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log(`Found ${duplicates.length} duplicate question groups.`);

        if (duplicates.length > 0) {
            console.log("Sample duplicate:", duplicates[0]._id);
            console.log("Count:", duplicates[0].count);

            // Delete all questions
            console.log("🗑️ Deleting ALL questions to force regeneration with new dynamic logic...");
            await QuestionBank.deleteMany({});
            console.log("✅ Database cleared.");
        } else {
            // Even if no duplicates, if the user says "same questions", 
            // and we are on fallback, maybe we should clear anyway to use the NEW fallback?
            console.log("No duplicates, but clearing DB to ensure new fallback logic is used.");
            await QuestionBank.deleteMany({});
            console.log("✅ Database cleared.");
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndCleanup();
