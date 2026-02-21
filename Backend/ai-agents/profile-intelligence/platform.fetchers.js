const axios = require("axios");

async function fetchPublicProfile(url) {
    try {
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "TheSensesBot/1.0 (Public Data Analyzer)",
            },
            timeout: 8000,
        });

        return res.data;
    } catch (error) {
        return null;
    }
}

module.exports = { fetchPublicProfile };
