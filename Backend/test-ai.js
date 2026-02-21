// Test script for AI Intelligence Agent
const http = require('http');

function testAIAgent() {
    const data = JSON.stringify({
        answers: { q1: 8, q2: 7, q3: 9 },
        jobProfile: "developer",
        difficulty: "hard"
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

    const req = http.request(options, (res) => {
        let responseData = '';

        console.log('\n✅ Test Request Sent to: http://localhost:5000/api/intelligence/evaluate');
        console.log('📤 Request Body:', JSON.parse(data));
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);
        console.log('\n📥 Response:');

        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            try {
                const jsonResponse = JSON.parse(responseData);
                console.log(JSON.stringify(jsonResponse, null, 2));
                
                if (jsonResponse.success) {
                    console.log('\n🎉 AI AGENT TEST PASSED!');
                    console.log('Score:', jsonResponse.result.score);
                    console.log('Normalized Answers:', jsonResponse.result.normalizedAnswers);
                } else {
                    console.log('\n⚠️ Request failed:', jsonResponse.error);
                }
            } catch (e) {
                console.log(responseData);
            }
            process.exit(0);
        });
    });

    req.on('error', (error) => {
        console.error('❌ Test Failed:', error.message);
        process.exit(1);
    });

    req.write(data);
    req.end();
}

testAIAgent();
