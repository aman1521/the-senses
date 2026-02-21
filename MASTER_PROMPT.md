# 🧠 The Senses — Master Prompt & System Architecture

**Tagline:** *The Senses turns thinking ability into social proof.*

It is a multi-dimensional intelligence assessment platform that evaluates:

- Logical reasoning
- Pattern recognition
- Memory
- Speed
- Spatial intelligence
- Motor intelligence (via computer vision)
- AI-evaluated reasoning

The platform must:

1. Record detailed test attempts
2. Calculate intelligent weighted scores
3. Normalize results globally
4. Assign percentile and global rank
5. Update leaderboard dynamically
6. Generate shareable social proof
7. Support future AI-based reasoning evaluation

---

## 🏗 SYSTEM ARCHITECTURE REQUIREMENTS

The system uses:

**Backend:**

- Node.js
- Express
- MongoDB
- JWT Authentication
- Rate limiting
- Secure middleware

**Optional Microservice:**

- Python (for Computer Vision)
- OpenCV
- MediaPipe
- WebSocket communication

**Frontend:**

- React (or modern JS framework)
- Real-time interaction capability

---

## 🗄 DATABASE MODELS REQUIRED

Create these MongoDB models:

### 1. User

- `name`
- `email`
- `password`
- `bio`
- `profileImage`
- `globalScore`
- `percentile`
- `globalRank`
- `xp`
- `level`
- `streak`
- `createdAt`

### 2. Test

- `title`
- `category` (logic | memory | speed | spatial | vision)
- `difficulty` (1–10)
- `timeLimit`
- `questions[]`

### 3. Question

- `testId`
- `type` (mcq | open | pattern | gesture)
- `difficulty`
- `correctAnswer`
- `options[]`
- `explanation`

### 4. Attempt

- `userId`
- `testId`
- `startedAt`
- `endedAt`
- `answers[]`
  - `questionId`
  - `selectedAnswer`
  - `timeTaken`
  - `isCorrect`
- `rawScore`
- `speedScore`
- `consistencyScore`
- `gestureScore` (optional)
- `aiReasoningScore` (optional)
- `finalScore`

---

## 🧮 SCORING ENGINE REQUIREMENTS

When a user submits a test:

**1. Calculate Accuracy:**
`Accuracy = (Correct Answers / Total Questions) × 100`

**2. Calculate Speed Score:**
`Speed Factor = ExpectedTime / ActualTime`
`SpeedScore = Accuracy × SpeedFactor`

**3. Apply Difficulty Multiplier:**
`DifficultyMultiplier = 1 + (difficulty / 10)`

**4. Calculate Consistency Index:**
Based on standard deviation of `timeTaken`.

**5. Optional AI Reasoning Score:**
LLM evaluates:

- Logical coherence
- Depth
- Clarity
- Originality

**6. Optional Gesture Score:**
Based on:

- Reaction latency
- Precision
- Stability

**7. Final Score:**
`FinalScore = (Accuracy × 0.4) + (SpeedScore × 0.2) + (DifficultyMultiplier × 0.2) + (Consistency × 0.2)`

*If AI reasoning exists:*
`FinalScore = (ObjectiveScore × 0.7) + (AIReasoning × 0.3)`

---

## 🏆 RANKING SYSTEM

After each attempt:

1. Update user `globalScore`
2. Normalize using percentile: `Percentile = (UsersBelow / TotalUsers) × 100`
3. Sort users descending by `globalScore`
4. Assign `globalRank`
5. Update leaderboard

**Leaderboard API must:**

- Return top 100 users
- Support filtering by category
- Support country/city in future

---

## 👁 COMPUTER VISION INTEGRATION

Integrate real-time hand tracking using:

- OpenCV
- MediaPipe (21 hand landmarks)

**Possible Vision Tests:**

1. Reaction Speed Test
2. Gesture Memory Sequence
3. Precision Movement Test
4. Impulse Control Test

**For each:**

- Track landmark coordinates
- Measure latency
- Measure accuracy
- Convert metrics into `gestureScore`
- Send to backend via API

**Architecture:**
Webcam → MediaPipe → Extract landmark coordinates → Calculate gesture metrics → Send JSON to Node backend → Store in Attempt model

---

## 📊 DASHBOARD REQUIREMENTS

User Dashboard must show:

- Total Attempts
- Average Score
- Rank Movement
- Percentile
- Category Strength Breakdown
- Performance Trends
- Cognitive Profile Insights

---

## 🔁 GAMIFICATION FEATURES

Add:

- Daily challenges
- Streak multiplier
- XP system
- Achievement badges
- Rank decay for inactivity

---

## 🛡 SECURITY & ANTI-CHEAT

Implement:

- Abnormal speed detection
- Random clicking detection
- AI-generated answer detection
- Device/session tracking
- Attempt anomaly flagging

---

## 🎯 FINAL OBJECTIVE

Build **The Senses** as:
A multi-dimensional intelligence evaluation platform that combines **cognitive testing**, **AI reasoning evaluation**, **computer vision motor analysis**, a **global ranking system**, and **social proof generation**.

It must **not** function as a simple quiz app.
It must function as a **scalable intelligence assessment engine**.
