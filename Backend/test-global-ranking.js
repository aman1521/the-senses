// Test script for Global Ranking Feature
const http = require('http');

function testGlobalRanking() {
    const testCases = [
        {
            name: "Developer - Hard - Expert",
            userId: "dev-expert",
            answers: { q1: 9, q2: 9, q3: 10 },
            jobProfile: "developer",
            difficulty: "hard"
        },
        {
            name: "Designer - Medium - Good",
            userId: "design-good",
            answers: { q1: 7, q2: 8, q3: 7 },
            jobProfile: "designer",
            difficulty: "medium"
        },
        {
            name: "Marketer - Easy - Average",
            userId: "market-avg",
            answers: { q1: 5, q2: 6, q3: 5 },
            jobProfile: "marketer",
            difficulty: "easy"
        }
    ];

    console.log('\n' + '='.repeat(70));
    console.log('🏆 THE SENSES - GLOBAL RANKING FEATURE TEST');
    console.log('='.repeat(70));

    let completed = 0;

    testCases.forEach((testCase, index) => {
        setTimeout(() => {
            sendTestRequest(testCase, index + 1, testCases.length, () => {
                completed++;
                if (completed === testCases.length) {
                    console.log('\n' + '='.repeat(70));
                    console.log('✅ ALL TESTS COMPLETED');
                    console.log('='.repeat(70));
                    process.exit(0);
                }
            });
        }, index * 1000);
    });
}

function sendTestRequest(testCase, testNum, totalTests, callback) {
    const data = JSON.stringify({
        userId: testCase.userId,
        answers: testCase.answers,
        jobProfile: testCase.jobProfile,
        difficulty: testCase.difficulty
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/intelligence/evaluate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log(`\n📝 Test ${testNum}/${totalTests}: ${testCase.name}`);
    console.log('─'.repeat(70));

    const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            try {
                const jsonResponse = JSON.parse(responseData);
                
                if (jsonResponse.success && jsonResponse.result) {
                    const result = jsonResponse.result;
                    const ranking = result.ranking;

                    console.log(`Status: ✅ Success`);
                    console.log(`User ID: ${testCase.userId}`);
                    console.log(`Profile: ${testCase.jobProfile.toUpperCase()}`);
                    console.log(`Difficulty: ${testCase.difficulty.toUpperCase()}`);
                    console.log(`\n📊 Results:`);
                    console.log(`  Score: ${result.score}`);
                    console.log(`  Normalized Score: ${ranking.normalizedScore}`);
                    console.log(`  Global Rank: ${ranking.globalRank}`);
                    console.log(`  Country Rank: ${ranking.countryRank}`);
                    console.log(`  Percentile: ${ranking.percentile}%`);
                    console.log(`  Answers: ${JSON.stringify(result.normalizedAnswers)}`);
                } else {
                    console.log(`Status: ❌ Failed`);
                    console.log(`Error: ${jsonResponse.error || 'Unknown error'}`);
                }
            } catch (e) {
                console.log(`Status: ❌ Parse Error`);
                console.log(`Response: ${responseData}`);
            }
            callback();
        });
    });

    req.on('error', (error) => {
        console.log(`Status: ❌ Request Failed`);
        console.log(`Error: ${error.message}`);
        callback();
    });

    req.write(data);
    req.end();
}

console.log('🔄 Connecting to http://localhost:5000...');
testGlobalRanking();
