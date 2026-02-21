async function showResult() {
  let score = 0;
  // (scoring logic same as before...)
  const finalScore = Math.min(score, 100);
  const category = categories.find(c => finalScore >= c.min && finalScore <= c.max).name;

  // Save to backend
  try {
    await fetch("http://localhost:5000/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName: "Guest", // later replace with logged-in user
        answers,
        score: finalScore,
        category
      })
    });
  } catch (err) {
    console.error("Backend error:", err);
  }

  root.innerHTML = `
    <div class="card">
      <h2>Your Score: ${finalScore}/100</h2>
      <h3>Category: ${category}</h3>
      <p>${getFeedback(finalScore)}</p>
      <button class="btn" onclick="showLeaderboard()">View Leaderboard</button>
    </div>
  `;
}

async function showLeaderboard() {
  const res = await fetch("http://localhost:5000/api/leaderboard");
  const data = await res.json();
  root.innerHTML = `
    <div class="card">
      <h2>Leaderboard</h2>
      <ol>
        ${data.map(s => `<li>${s.playerName}: ${s.score} (${s.category})</li>`).join('')}
      </ol>
      <button class="btn" onclick="showQuestion()">Play Again</button>
    </div>
  `;
}
app.use(generalLimiter);
app.use("/api/intelligence", strictLimiter);
app.use("/api/duels", strictLimiter);
