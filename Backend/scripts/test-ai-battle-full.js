const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAIBattle() {
    console.log('🧪 Testing AI Battle Feature...\n');

    try {
        // Test 1: Get AI Profiles
        console.log('1️⃣ Testing GET /api/ai-battles/profiles');
        const profilesRes = await axios.get(`${API_URL}/ai-battles/profiles`);
        console.log(`✅ Fetched ${profilesRes.data.length} AI profiles`);

        if (profilesRes.data.length === 0) {
            console.error('❌ No AI profiles found! Run: node seed/seedAIProfiles.js');
            return;
        }

        const ai1 = profilesRes.data[0];
        const ai2 = profilesRes.data[1];
        console.log(`   Selected: ${ai1.emoji} ${ai1.name} vs ${ai2.emoji} ${ai2.name}\n`);

        // Test 2: Simulate Battle
        console.log('2️⃣ Testing POST /api/ai-battles/simulate');
        const testPrompt = "Explain quantum computing in simple terms";
        const battleRes = await axios.post(`${API_URL}/ai-battles/simulate`, {
            ai1Id: ai1._id,
            ai2Id: ai2._id,
            prompt: testPrompt
        });

        console.log(`✅ Battle completed!`);
        console.log(`   Prompt: "${testPrompt}"`);
        console.log(`   ${ai1.name} Response: ${battleRes.data.responses.ai1Response.substring(0, 100)}...`);
        console.log(`   ${ai2.name} Response: ${battleRes.data.responses.ai2Response.substring(0, 100)}...\n`);

        // Test 3: Submit Vote
        console.log('3️⃣ Testing POST /api/ai-battles/vote');
        const voteRes = await axios.post(`${API_URL}/ai-battles/vote`, {
            ai1Id: ai1._id,
            ai2Id: ai2._id,
            winnerId: ai1._id,
            score1: 85,
            score2: 75
        });

        console.log(`✅ Vote submitted successfully!`);
        console.log(`   Winner: ${ai1.name}`);
        console.log(`   Updated stats received\n`);

        // Test 4: Get Battle History
        console.log('4️⃣ Testing GET /api/ai-battles/history');
        const historyRes = await axios.get(`${API_URL}/ai-battles/history`);
        console.log(`✅ Retrieved battle history (${historyRes.data.length} AI models)`);

        console.log('\n📊 Leaderboard:');
        historyRes.data.forEach((ai, idx) => {
            console.log(`   ${idx + 1}. ${ai.emoji} ${ai.name} - Wins: ${ai.wins}, Losses: ${ai.losses}, Win Rate: ${ai.winRate}%`);
        });

        console.log('\n🎉 All tests passed! AI Battle feature is working correctly!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Make sure the backend server is running: node server.js');
        }
    }
}

testAIBattle();
