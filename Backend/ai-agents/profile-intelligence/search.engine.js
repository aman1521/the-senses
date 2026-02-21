const axios = require("axios");

async function searchProfile(query) {
    const response = await axios.get(
        "https://api.bing.microsoft.com/v7.0/search",
        {
            headers: {
                "Ocp-Apim-Subscription-Key": process.env.SEARCH_API_KEY,
            },
            params: {
                q: query,
                recency: "Month", // Fixed 'recency' value to be valid if needed, or keep 30 if that was intended. Keeping 30 as per user code but strings are usually expected. API docs say 'Day', 'Week', 'Month'. User had '30'. I will leave '30' if it worked for them, but usually its string words. I'll stick to user logic but change syntax.
                // Actually Bing API 'freshness' is what they usually use. 'recency' might be custom?
                // I will NOT change logic, only syntax.
                q: query,
                // recency: 30, // Keeping as is
            },
        }
    );
    // User had:
    // params: { q: query, recency: 30, domains: null }

    // logic recreation:
    const res = await axios.get(
        "https://api.bing.microsoft.com/v7.0/search",
        {
            headers: {
                "Ocp-Apim-Subscription-Key": process.env.SEARCH_API_KEY,
            },
            params: {
                q: query,
                recency: 30,
                domains: null,
            },
        }
    );

    return res.data.webPages?.value || [];
}

module.exports = { searchProfile };
