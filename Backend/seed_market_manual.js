const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/market-updates/seed',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log("🌱 Attempting to seed market data...");

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log("✅ Seed Success:", data);
        } else {
            console.log("❌ Seed Failed:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.end();
