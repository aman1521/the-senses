"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getResultBySlug } from "@/lib/api";

export default function ShareSlugPage() {
  const { slug } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchResult() {
      try {
        const data = await getResultBySlug(slug);
        setResult(data.result);
      } catch (err) {
        console.error(err);
        setError("Result not found");
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [slug]);

  if (loading) return <p className="loading">Loading result…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!result) return <p className="error">Result not found</p>;

  const { profile, rank, share } = result;

  return (
    <main className="result">
      {/* Rank Highlight */}
      <section className="rank-hero">
        <span className="tier">{rank.tier}</span>
        <h1>{share.headline}</h1>
        <p>
          Ranked higher than{" "}
          <strong>{rank.globalPercentile}%</strong> of participants
        </p>
      </section>

      {/* Intelligence Profile */}
      <section className="profile-card">
        <h2>{profile.thinkingStyle}</h2>
        <p className="summary">{profile.summary}</p>

        <div className="grid">
          <div>
            <h4>Strengths</h4>
            <ul>
              {profile.strengths && profile.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Cognitive Biases</h4>
            <ul>
              {profile.cognitiveBiases && profile.cognitiveBiases.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Share Info */}
      <section className="share-section">
        <p>Shareable Link: <code>{typeof window !== "undefined" ? window.location.href : ""}</code></p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
          }}
        >
          Copy Link
        </button>
      </section>
    </main>
  );
}
