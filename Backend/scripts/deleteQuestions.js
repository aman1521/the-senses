const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const QuestionBank = require('../models/QuestionBank');

dotenv.config({ path: '../.env' }); // Adjust path if needed

const deleteQuestions = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGO_URI not found in environment variables.");
            // Try looking in current directory .env if previous failed
            require('dotenv').config();
        }

        if (!process.env.MONGO_URI) {
            console.error("Critical: MONGO_URI is still missing. Cannot proceed.");
            process.exit(1);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const qResult = await Question.deleteMany({});
        console.log(`Deleted ${qResult.deletedCount} documents from Question collection.`);

        const qbResult = await QuestionBank.deleteMany({});
        console.log(`Deleted ${qbResult.deletedCount} documents from QuestionBank collection.`);

        console.log("All questions deleted successfully.");
    } catch (error) {
        console.error("Error deleting questions:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

deleteQuestions();
