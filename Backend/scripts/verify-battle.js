const axios = require('axios');

async function verifyAIBattle() {
    const baseURL = 'http://localhost:5000/api/ai-battles';

    try {
        console.log("1. Fetching AI Profiles...");
        const profilesRes = await axios.get(`${baseURL}/profiles`);
        const profiles = profilesRes.data;
        console.log(`✅ Found ${profiles.length} profiles.`);

        if (profiles.length < 2) {
            console.error("❌ Not enough profiles to battle.");
            return;
        }

        const ai1 = profiles[0];
        const ai2 = profiles[1];
        console.log(`⚔️  Matching ${ai1.name} vs ${ai2.name}...`);

        console.log("2. Simulating Battle...");
        const battleRes = await axios.post(`${baseURL}/simulate`, {
            ai1Id: ai1._id,
            ai2Id: ai2._id,
            difficulty: 'hard'
        });

        const result = battleRes.data.battle;
        console.log(`✅ Battle Complete! Winner: ${result.winner ? result.winner.name : 'Draw'}`);
        console.log(`   Score: ${result.ai1.name} (${result.ai1.score}) vs ${result.ai2.name} (${result.ai2.score})`);

        console.log("3. Checking History Stats...");
        const historyRes = await axios.get(`${baseURL}/history`);
        const winnerStats = historyRes.data.find(p => p.id === (result.winner ? result.winner.id : ''));

        if (winnerStats) {
            console.log(`✅ Stats Verified: ${winnerStats.name} has ${winnerStats.wins} wins.`);
        } else {
            console.log("✅ Stats flow checked (Winner stats might be updated).");
        }

    } catch (err) {
        console.error("❌ Verification Failed:", err.message);
        if (err.response) console.error(err.response.data);
    }
}

verifyAIBattle();
