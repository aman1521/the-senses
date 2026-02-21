const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

export async function startTestSession() {
  const res = await fetch(`${API_BASE}/test/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to start session");
  return res.json();
}

export async function submitTest(sessionId, answers) {
  const res = await fetch(`${API_BASE}/test/session/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, answers }),
  });

  if (!res.ok) throw new Error("Failed to submit test");
  return res.json();
}

export async function fetchGlobalRankings(filters = {}) {
  // Convert filters object to query string
  const queryParams = new URLSearchParams(filters).toString();
  const url = `${API_BASE}/api/v1/leaderboard${queryParams ? `?${queryParams}` : ''}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Failed to fetch rankings");
  return res.json();
}

export async function getResultBySlug(slug) {
  const res = await fetch(`${API_BASE}/api/intelligence/result/${slug}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Result not found");
  return res.json();
}
