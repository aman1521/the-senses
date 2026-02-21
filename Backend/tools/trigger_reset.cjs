const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/auth';

async function triggerReset() {
    try {
        console.log('Requesting Password Reset...');
        const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'amanchouhan1217@gmail.com' })
        });

        const forgotData = await forgotRes.json();
        console.log('Response:', forgotData);

    } catch (e) {
        console.error('Error:', e);
    }
}

triggerReset();
