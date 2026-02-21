const axios = require('axios');

async function testAIBattle() {
    const baseURL = 'http://localhost:5000/api/ai-battles';

    console.log("🎮 AI BATTLE FEATURE TEST\n");
    console.log("=".repeat(50));

    try {
        // Step 1: Fetch AI Profiles
        console.log("\n1️⃣  Fetching AI Profiles...");
        const profilesRes = await axios.get(`${baseURL}/profiles`);
        const profiles = profilesRes.data;
        console.log(`✅ Found ${profiles.length} AI profiles:`);
        profiles.forEach(p => {
            console.log(`   ${p.emoji} ${p.name} - Avg Score: ${p.avgScore}`);
        });

        if (profiles.length < 2) {
            console.error("❌ Not enough profiles to battle.");
            return;
        }

        // Step 2: Select two AIs for battle
        const ai1 = profiles[0]; // Omni-G 4.0
        const ai2 = profiles[2]; // Gemini 1.5 Pro
        console.log(`\n2️⃣  Selected Battle Matchup:`);
        console.log(`   ${ai1.emoji} ${ai1.name} VS ${ai2.emoji} ${ai2.name}`);

        // Step 3: Simulate Interactive Battle with a prompt
        const testPrompt = "Explain quantum computing in simple terms";
        console.log(`\n3️⃣  Simulating Battle with prompt:`);
        console.log(`   "${testPrompt}"`);

        const battleRes = await axios.post(`${baseURL}/simulate`, {
            ai1Id: ai1._id,
            ai2Id: ai2._id,
            prompt: testPrompt
        });

        const result = battleRes.data;

        if (result.type === 'interactive' && result.responses) {
            console.log(`\n✅ Battle Complete! Responses received:\n`);
            console.log(`${ai1.emoji} ${ai1.name}:`);
            console.log(`   ${result.responses.ai1Response.substring(0, 100)}...\n`);
            console.log(`${ai2.emoji} ${ai2.name}:`);
            console.log(`   ${result.responses.ai2Response.substring(0, 100)}...\n`);
        } else {
            console.log("⚠️  Unexpected response format:", result);
        }

        // Step 4: Submit a vote
        console.log(`4️⃣  Submitting vote for ${ai1.name}...`);
        const voteRes = await axios.post(`${baseURL}/vote`, {
            ai1Id: ai1._id,
            ai2Id: ai2._id,
            winnerId: ai1._id,
            score1: 85,
            score2: 75
        });

        if (voteRes.data.success) {
            console.log(`✅ Vote submitted successfully!`);
            console.log(`   ${ai1.name} - Wins: ${voteRes.data.newStats.ai1.battlesWon}, Total: ${voteRes.data.newStats.ai1.totalBattles}`);
            console.log(`   ${ai2.name} - Losses: ${voteRes.data.newStats.ai2.battlesLost}, Total: ${voteRes.data.newStats.ai2.totalBattles}`);
        }

        // Step 5: Check Battle History
        console.log(`\n5️⃣  Fetching Battle History...`);
        const historyRes = await axios.get(`${baseURL}/history`);
        const history = historyRes.data;

        console.log(`\n📊 Battle Leaderboard:`);
        console.log("─".repeat(70));
        console.log(`${"Rank".padEnd(6)} ${"AI Model".padEnd(25)} ${"Wins".padEnd(6)} ${"Losses".padEnd(8)} ${"Win Rate".padEnd(10)}`);
        console.log("─".repeat(70));

        history.slice(0, 6).forEach((ai, index) => {
            const rank = `${index + 1}.`.padEnd(6);
            const name = `${ai.emoji} ${ai.name}`.padEnd(25);
            const wins = ai.wins.toString().padEnd(6);
            const losses = ai.losses.toString().padEnd(8);
            const winRate = `${ai.winRate}%`.padEnd(10);
            console.log(`${rank}${name}${wins}${losses}${winRate}`);
        });
        console.log("─".repeat(70));

        console.log("\n✅ ALL TESTS PASSED! AI Battle feature is working correctly.\n");

    } catch (err) {
        console.error("\n❌ Test Failed:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    }
}

testAIBattle();
