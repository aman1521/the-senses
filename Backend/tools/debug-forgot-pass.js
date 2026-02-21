const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/auth';

async function testForgotPass() {
    try {
        console.log('1. Registering test user...');
        const email = `test_${Date.now()}@example.com`;
        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email,
                password: 'Password123!',
                profileType: 'software-engineer'
            })
        });
        const regData = await regRes.json();
        console.log('Register Response:', regData);

        if (!regData.success && !regData.token && !regData.user) {
            console.error('Registration failed, cannot proceed.');
            return;
        }

        console.log('2. Requesting Password Reset...');
        const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const forgotData = await forgotRes.json();
        console.log('Forgot Password Response:', forgotData);

        if (forgotRes.status !== 200) {
            console.error('❌ Failed!');
        } else {
            console.log('✅ Success!');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testForgotPass();
