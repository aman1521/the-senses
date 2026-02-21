// scripts/resetDatabase.js
// Clears user-related data from the database for a fresh start

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/senses';

async function resetDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Import models
        const User = require('../models/User');
        const IntelligenceResult = require('../models/IntelligenceResult');
        const TestSession = require('../models/TestSession');
        const IntegrityEvent = require('../models/IntegrityEvent');
        const VideoIntro = require('../models/VideoIntro');
        const Notification = require('../models/Notification');
        const UserProfile = require('../models/UserProfile');

        console.log('\n🗑️ Deleting all user data...\n');

        // Delete in order (to handle dependencies)
        const results = await Promise.all([
            User.deleteMany({}),
            IntelligenceResult.deleteMany({}),
            TestSession.deleteMany({}),
            IntegrityEvent.deleteMany({}),
            VideoIntro.deleteMany({}),
            Notification.deleteMany({}),
            UserProfile.deleteMany({})
        ]);

        console.log(`✅ Users deleted: ${results[0].deletedCount}`);
        console.log(`✅ Intelligence Results deleted: ${results[1].deletedCount}`);
        console.log(`✅ Test Sessions deleted: ${results[2].deletedCount}`);
        console.log(`✅ Integrity Events deleted: ${results[3].deletedCount}`);
        console.log(`✅ Video Intros deleted: ${results[4].deletedCount}`);
        console.log(`✅ Notifications deleted: ${results[5].deletedCount}`);
        console.log(`✅ User Profiles deleted: ${results[6].deletedCount}`);

        console.log('\n✅ Database reset complete! All user data cleared.\n');
        console.log('📝 You can now register new users with fresh data.\n');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

resetDatabase();
