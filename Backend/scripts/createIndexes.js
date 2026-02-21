const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // IntelligenceResult indexes
        console.log('Creating IntelligenceResult indexes...');
        await db.collection('intelligenceresults').createIndex({ userId: 1 });
        await db.collection('intelligenceresults').createIndex({ normalizedScore: -1 });
        await db.collection('intelligenceresults').createIndex({ trustScore: -1 });
        await db.collection('intelligenceresults').createIndex({ testHash: 1 });
        await db.collection('intelligenceresults').createIndex(
            { normalizedScore: -1, trustScore: -1, createdAt: 1 }
        );
        console.log('✅ IntelligenceResult indexes created');

        // Duel indexes
        console.log('Creating Duel indexes...');
        await db.collection('duels').createIndex({ challenger: 1 });
        await db.collection('duels').createIndex({ opponent: 1 });
        await db.collection('duels').createIndex({ status: 1 });
        await db.collection('duels').createIndex({ createdAt: -1 });
        console.log('✅ Duel indexes created');

        // UserProfile indexes
        console.log('Creating UserProfile indexes...');
        await db.collection('userprofiles').createIndex({ userId: 1 }, { unique: true });
        await db.collection('userprofiles').createIndex({ 'stats.bestScore': -1 });
        console.log('✅ UserProfile indexes created');

        // User indexes
        console.log('Creating User indexes...');
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ trustLevel: 1 });
        await db.collection('users').createIndex({ bestScoreEver: -1 });
        console.log('✅ User indexes created');

        // AIProfile indexes
        console.log('Creating AIProfile indexes...');
        await db.collection('aiprofiles').createIndex({ name: 1 }, { unique: true });
        await db.collection('aiprofiles').createIndex({ battlesWon: -1 });
        console.log('✅ AIProfile indexes created');

        console.log('\n🎉 All indexes created successfully!');
        console.log('📊 Index Summary:');

        const collections = ['intelligenceresults', 'duels', 'userprofiles', 'users', 'aiprofiles'];
        for (const col of collections) {
            const indexes = await db.collection(col).indexes();
            console.log(`\n${col}:`);
            indexes.forEach(idx => {
                console.log(`  - ${JSON.stringify(idx.key)}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Index creation failed:', error);
        process.exit(1);
    }
}

createIndexes();
