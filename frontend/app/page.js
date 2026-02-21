import Hero from "@/components/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero />
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { startTestSession, submitTest } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { useRouter } from "next/navigation";

const QUESTIONS = [
  {
    id: 1,
    q: "When solving a complex problem, what do you rely on first?",
    options: [
      "Logical breakdown",
      "Pattern recognition",
      "Intuition",
      "Past experience",
    ],
  },
  {
    id: 2,
    q: "How do you react under pressure?",
    options: [
      "Stay analytical",
      "Adapt quickly",
      "Take calculated risks",
      "Delegate or seek input",
    ],
  },
];

export default function TestPage() {
  const router = useRouter();

  const [sessionId, setSessionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(true);

  // Start AI test session
  useEffect(() => {
    startTestSession()
      .then((data) => {
        setSessionId(data.sessionId);
        saveSession(data);
        setLoading(false);
      })
      .catch(() => {
        alert("Failed to start test");
      });
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) handleSubmit();

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  function selectAnswer(qId, option) {
    setAnswers({ ...answers, [qId]: option });
  }

  async function handleSubmit() {
    if (!sessionId) return;

    try {
      const response = await submitTest(sessionId, answers);
      // response.result now contains complete data with slug, profile, rank, share
      saveSession({
        sessionId,
        result: response.result,
      });
      router.push("/result");
    } catch (err) {
      alert("Submission failed");
    }
  }

  if (loading) return <p>Initializing intelligence engine…</p>;

  return (
    <main className="test">
      <div className="timer">
        Time Left: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.id} className="question">
          <h3>{q.q}</h3>
          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => selectAnswer(q.id, opt)}
              className={answers[q.id] === opt ? "active" : ""}
            >
              {opt}
            </button>
          ))}
        </div>
      ))}

      <button className="submit" onClick={handleSubmit}>
        Submit for Analysis →
      </button>
    </main>
  );
}
