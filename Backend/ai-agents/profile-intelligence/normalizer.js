function normalizeAnswers(rawAnswers) {
    const normalized = {};

    for (const key in rawAnswers) {
        normalized[key] = Math.max(
            0,
            Math.min(10, Number(rawAnswers[key]) || 0)
        );
    }

    return normalized;
}

function normalizeSearchResults(results) {
    return results.map((r) => ({
        title: r.name,
        url: r.url,
        snippet: r.snippet,
        source: new URL(r.url).hostname,
    }));
}

module.exports = { normalizeAnswers, normalizeSearchResults };
