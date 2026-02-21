# 🧠 SYSTEM LOGIC FLOW

## 1. Core Mathematical Model

### A. The Scoring Equation

$$ GlobalRank = (BaseScore \times IntegrityMultiplier) + ConsistencyBonus $$

* **Base Score:** Weighted average of Skill, Reasoning, and Reflex tests.
* **Integrity Multiplier:** 0.0 to 1.0 based on cheat probability (Tab switching, object detection).
* **Consistency Bonus:** Reward for maintaining stable performance over time (Standard Deviation inverse).

### B. The Bubble Algorithm (Discussion Ranking)

* **Depth Weight:** Deeper branches = Higher Topic Authority.
* **Diversity Weight:** Unique participants > Repeated replies.
* **Logic Score:** (Planned) AI analysis of argument structure.

---

## 2. Infrastructure Logic

### A. Request Lifecycle

1. **Gateway:** Validates JWT & Rate Limits.
2. **Controller:** Routes to specific service.
3. **Service:** Executes business logic (e.g., calculates score).
4. **Model:** Updates MongoDB state.
5. **Event:** Triggers Notifications (Async).

### B. Anti-Cheat Pipeline

1. **Client:** Captures events (blur, focus, keypress).
2. **Client:** Captures WebCam frames (random interval).
3. **Server:** Receives telemetry batch.
4. **Python Svc:** Runs vision analysis (Pose detection, Object detection).
5. **Server:** Aggregates risk score → Flags session if Risk > Threshold.

---

## 3. Unified Dashboard Logic

| Data Point | User View (Growth) | Company View (Evaluation) |
| :--- | :--- | :--- |
| **Score** | "You improved by 5%" | "Candidate is Top 10%" |
| **Focus** | "Work on attention span" | "High stability verified" |
| **Activity** | "Reflection Journal" | "Evidence of Thinking" |
| **Social** | "Discussions engaged" | *Hidden / Irrelevant* |

---

## 4. Adaptive Coaching Logic (New)

### A. Micro-Gap Analysis

* **Input:** Wrong answers + Timing data.
* **Detection:** "Fast failure" (Impatience) vs. "Slow failure" (Knowledge gap).
* **Output:** Specific drill recommendation (e.g., "Speed Drills" vs. "Deep Read").

### B. Intervention Loop

* User fails pattern X → System flags Gap X → Next Session prioritizes Gap X questions.
